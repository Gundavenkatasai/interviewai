// @ts-nocheck
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { IResumeRenderDocument } from "../renderModel";
import { ATSClassicTemplate } from "./ATSClassicTemplate";

export class PdfRenderer {
  static async render(docModel: IResumeRenderDocument, templateId: string, pageSize: "A4" | "Letter"): Promise<Buffer> {
    
    // Select template component based on templateId
    // For Day 9, we'll route ATS Classic, Compact, Professional, Executive, Modern
    // Currently implementing ATSClassicTemplate as a proof of concept for the shared engine.
    let TemplateComponent = ATSClassicTemplate;

    // We can add switch statements here later for other templates

    const stream = await renderToStream(<TemplateComponent doc={docModel} pageSize={pageSize} />);
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}
