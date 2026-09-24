/**
 * DocxInlineEditLayer
 *
 * Wraps the docx-preview rendered container and adds direct inline
 * editing capability — users can click text in the canvas and type,
 * just like a Word document.
 *
 * Architecture:
 * 1. After docx-preview renders, we walk its DOM
 * 2. We identify paragraph-level elements (p, td, li, span blocks)
 *    that correspond to editable fields via the fieldsByParagraphIndex map
 * 3. We attach contenteditable + event listeners to those nodes
 * 4. On blur/Enter: extract new text, call onFieldChange(fieldId, newValue)
 * 5. The sidebar and field state sync immediately — no server round-trip
 *
 * For optimistic canvas updates:
 * When a sidebar field changes, the caller can call applyOptimisticUpdate()
 * to immediately update the corresponding DOM node text.
 *
 * Limitations:
 * - Complex multi-run formatted text is flattened to plain text in the replacement
 *   (the server-side mutation engine handles formatting preservation on Save & Preview)
 * - Table cells are editable via sidebar; direct table cell inline editing
 *   is experimental and uses best-effort paragraph detection
 * - Text boxes: not inline-editable (read-only, as documented)
 */

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { IFieldByParaIndex } from "../../../lib/importedDocxApi";

export interface DocxInlineEditLayerHandle {
  /** Immediately update the canvas text for a given fieldId (optimistic update from sidebar) */
  applyOptimisticUpdate: (fieldId: string, newValue: string) => void;
  /** Scroll the canvas to the paragraph corresponding to a fieldId */
  scrollToField: (fieldId: string) => void;
  /** Re-attach inline edit listeners after a re-render */
  reattach: () => void;
}

interface Props {
  /** The div that docx-preview rendered into */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Map from paragraph-index key → field metadata (from useImportedDocxEditor) */
  fieldsByParaIndexRef: React.MutableRefObject<Record<string, IFieldByParaIndex>>;
  /** Called when user edits a paragraph directly in the canvas */
  onFieldChange: (fieldId: string, newValue: string, originalValue: string) => void;
  /** Called when user focuses a paragraph (for sidebar highlight sync) */
  onFieldFocus?: (fieldId: string) => void;
  /** Whether inline editing is enabled (false during rendering/loading) */
  enabled?: boolean;
  /** Active field ID to highlight in the canvas */
  activeFieldId?: string | null;
  /** Currently pending change values (for showing edited state) */
  pendingChanges?: Record<string, string>;
}

// CSS classes applied to editable paragraphs
const EDITABLE_CLASS = "docx-inline-editable";
const FOCUSED_CLASS = "docx-inline-focused";
const MODIFIED_CLASS = "docx-inline-modified";
const HIGHLIGHTED_CLASS = "docx-inline-highlighted";

// Data attribute written to each editable node for fast lookup
const PARA_KEY_ATTR = "data-docx-para-key";
const FIELD_ID_ATTR = "data-docx-field-id";

export const DocxInlineEditLayer = forwardRef<DocxInlineEditLayerHandle, Props>(
  function DocxInlineEditLayer(
    {
      containerRef,
      fieldsByParaIndexRef,
      onFieldChange,
      onFieldFocus,
      enabled = true,
      activeFieldId,
      pendingChanges = {},
    },
    ref
  ) {
    // Track all editable nodes keyed by fieldId for optimistic updates
    const nodesByFieldId = useRef<Map<string, HTMLElement>>(new Map());
    // Track all nodes keyed by para-index key for fast lookup
    const nodesByParaKey = useRef<Map<string, HTMLElement>>(new Map());

    // --------------------------------------------------------
    // Attach inline editing to docx-preview rendered paragraphs
    // --------------------------------------------------------
    const attachInlineEditing = useCallback(() => {
      const container = containerRef.current;
      if (!container || !enabled) return;

      const paraMap = fieldsByParaIndexRef.current;
      const paraKeys = Object.keys(paraMap);
      if (paraKeys.length === 0) return;

      nodesByFieldId.current.clear();
      nodesByParaKey.current.clear();

      // docx-preview renders paragraphs as <p> elements inside section.docx divs.
      // We collect all paragraphs in document order.
      const allParas = Array.from(
        container.querySelectorAll<HTMLElement>(
          ".docx section.docx p, .docx section.docx li, .docx-wrapper p, .docx-wrapper li"
        )
      );

      // Build a document-order index of all rendered paragraphs
      // docx-preview typically renders paragraphs in the same order as word/document.xml
      allParas.forEach((el, domIndex) => {
        // Try to find a matching field for this DOM paragraph index
        const key = `word/document.xml:${domIndex}`;
        const field = paraMap[key];

        if (!field) {
          // Also try without the document.xml prefix (some headers/footers)
          const altKeys = paraKeys.filter(k => k.endsWith(`:${domIndex}`));
          if (altKeys.length === 0) return;

          const altField = paraMap[altKeys[0]];
          if (!altField || !altField.isEditable) return;

          attachEditableToNode(el, altKeys[0], altField);
          return;
        }

        if (!field.isEditable) return;
        attachEditableToNode(el, key, field);
      });
    }, [containerRef, fieldsByParaIndexRef, enabled, onFieldChange, onFieldFocus]);

    const attachEditableToNode = (
      el: HTMLElement,
      paraKey: string,
      field: IFieldByParaIndex
    ) => {
      // Skip if already attached
      if (el.getAttribute(FIELD_ID_ATTR)) return;

      el.setAttribute("contenteditable", "true");
      el.setAttribute(PARA_KEY_ATTR, paraKey);
      el.setAttribute(FIELD_ID_ATTR, field.fieldId);
      el.classList.add(EDITABLE_CLASS);
      el.setAttribute("title", `Edit: ${field.label}`);
      el.setAttribute("spellcheck", "true");

      // Show modified state if there's a pending change
      if (pendingChanges[field.fieldId] !== undefined &&
          pendingChanges[field.fieldId] !== field.originalValue) {
        el.classList.add(MODIFIED_CLASS);
      }

      // Event: focus
      el.addEventListener("focus", () => {
        el.classList.add(FOCUSED_CLASS);
        onFieldFocus?.(field.fieldId);
      });

      // Event: blur — commit the change
      el.addEventListener("blur", () => {
        el.classList.remove(FOCUSED_CLASS);
        const newText = el.innerText || el.textContent || "";
        const trimmed = newText.trimEnd(); // preserve intentional leading space
        const fieldInfo = fieldsByParaIndexRef.current[paraKey];
        if (!fieldInfo) return;

        // Only fire if value actually changed
        if (trimmed !== fieldInfo.currentValue) {
          onFieldChange(fieldInfo.fieldId, trimmed, fieldInfo.originalValue);
          el.classList.add(MODIFIED_CLASS);
        }
      });

      // Event: prevent Enter from inserting <br> (would break paragraph structure)
      el.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          el.blur(); // commit on Enter
        }
        // Ctrl+Z / Cmd+Z: let the app's undo handle it
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          el.blur();
          // Bubble to parent for undo handling
          el.dispatchEvent(new CustomEvent("docx-undo", { bubbles: true }));
        }
      });

      nodesByFieldId.current.set(field.fieldId, el);
      nodesByParaKey.current.set(paraKey, el);
    };

    // --------------------------------------------------------
    // Optimistic update: immediately update DOM text for a field
    // Called when sidebar value changes (no round-trip needed)
    // --------------------------------------------------------
    const applyOptimisticUpdate = useCallback(
      (fieldId: string, newValue: string) => {
        const el = nodesByFieldId.current.get(fieldId);
        if (!el) return;

        // Only update if content differs (avoid cursor position disruption)
        const currentText = (el.innerText || el.textContent || "").trimEnd();
        if (currentText !== newValue) {
          // Preserve cursor: if element is not focused, direct update is safe
          if (document.activeElement !== el) {
            el.textContent = newValue;
          }
          el.classList.add(MODIFIED_CLASS);
        }
      },
      []
    );

    // --------------------------------------------------------
    // Scroll canvas to a specific field
    // --------------------------------------------------------
    const scrollToField = useCallback((fieldId: string) => {
      const el = nodesByFieldId.current.get(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, []);

    // --------------------------------------------------------
    // Reattach (called after canvas re-renders)
    // --------------------------------------------------------
    const reattach = useCallback(() => {
      // Remove old attributes before reattaching
      const container = containerRef.current;
      if (container) {
        container
          .querySelectorAll(`[${FIELD_ID_ATTR}]`)
          .forEach(el => {
            el.removeAttribute("contenteditable");
            el.removeAttribute(PARA_KEY_ATTR);
            el.removeAttribute(FIELD_ID_ATTR);
            el.classList.remove(EDITABLE_CLASS, FOCUSED_CLASS, MODIFIED_CLASS, HIGHLIGHTED_CLASS);
          });
      }
      nodesByFieldId.current.clear();
      nodesByParaKey.current.clear();
      attachInlineEditing();
    }, [attachInlineEditing, containerRef]);

    // --------------------------------------------------------
    // Expose handle to parent
    // --------------------------------------------------------
    useImperativeHandle(
      ref,
      () => ({
        applyOptimisticUpdate,
        scrollToField,
        reattach,
      }),
      [applyOptimisticUpdate, scrollToField, reattach]
    );

    // --------------------------------------------------------
    // Highlight the active field in the canvas
    // --------------------------------------------------------
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Remove all existing highlights
      container
        .querySelectorAll(`.${HIGHLIGHTED_CLASS}`)
        .forEach(el => el.classList.remove(HIGHLIGHTED_CLASS));

      if (!activeFieldId) return;

      const el = nodesByFieldId.current.get(activeFieldId);
      if (el) {
        el.classList.add(HIGHLIGHTED_CLASS);
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [activeFieldId, containerRef]);

    // --------------------------------------------------------
    // Attach modified class to pending change nodes
    // --------------------------------------------------------
    useEffect(() => {
      nodesByFieldId.current.forEach((el, fieldId) => {
        if (pendingChanges[fieldId] !== undefined) {
          const field = fieldsByParaIndexRef.current[el.getAttribute(PARA_KEY_ATTR) || ""];
          if (field && pendingChanges[fieldId] !== field.originalValue) {
            el.classList.add(MODIFIED_CLASS);
          } else {
            el.classList.remove(MODIFIED_CLASS);
          }
        }
      });
    }, [pendingChanges, fieldsByParaIndexRef]);

    // --------------------------------------------------------
    // Inject CSS for inline editing visual cues
    // --------------------------------------------------------
    return (
      <style>{`
        /* Inline editing visual cues — scoped to docx-preview container */
        .${EDITABLE_CLASS} {
          cursor: text;
          outline: none;
          border-radius: 2px;
          transition: background-color 0.12s ease, box-shadow 0.12s ease;
          position: relative;
        }

        .${EDITABLE_CLASS}:hover {
          background-color: rgba(99, 102, 241, 0.04) !important;
          box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
        }

        .${EDITABLE_CLASS}.${FOCUSED_CLASS} {
          background-color: rgba(99, 102, 241, 0.07) !important;
          box-shadow: inset 0 0 0 1.5px rgba(99, 102, 241, 0.45);
          outline: none;
        }

        .${EDITABLE_CLASS}.${MODIFIED_CLASS}:not(.${FOCUSED_CLASS}) {
          background-color: rgba(234, 179, 8, 0.06) !important;
          box-shadow: inset 0 0 0 1px rgba(234, 179, 8, 0.25);
        }

        .${EDITABLE_CLASS}.${HIGHLIGHTED_CLASS}:not(.${FOCUSED_CLASS}) {
          background-color: rgba(99, 102, 241, 0.1) !important;
          box-shadow: inset 0 0 0 1.5px rgba(99, 102, 241, 0.5);
        }

        /* Tooltip-style "click to edit" indicator on hover */
        .${EDITABLE_CLASS}::after {
          content: "✎";
          position: absolute;
          right: -18px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          color: rgba(99, 102, 241, 0.5);
          opacity: 0;
          transition: opacity 0.15s;
          pointer-events: none;
          user-select: none;
        }

        .${EDITABLE_CLASS}:hover::after {
          opacity: 1;
        }

        /* Remove default contenteditable outline */
        [contenteditable]:focus {
          outline: none;
        }

        /* Prevent editing of non-editable child elements inside the canvas */
        .docx-xerox-container [contenteditable="false"] {
          pointer-events: none;
          user-select: none;
        }
      `}</style>
    );
  }
);

DocxInlineEditLayer.displayName = "DocxInlineEditLayer";

export default DocxInlineEditLayer;
