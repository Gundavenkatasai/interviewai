
import { useState } from "react";

import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Sparkles,
  Terminal,
  Code2
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { CodeExecutionResponse, CodeReviewResponse } from "@/types";

import Editor from "@monaco-editor/react";

interface CodingSandboxProps {
  problemStatement: string;
  starterCode?: string;
  testCases?: { input: string; expected: string }[];
  defaultLanguage?: string;
  onSolutionSubmitted?: (code: string, review: CodeReviewResponse) => void;
}

const DEFAULT_SNIPPETS: Record<string, string> = {
  javascript: `// Implement your solution here
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test call
console.log(twoSum([2, 7, 11, 15], 9));
`,
  python: `# Implement your solution here
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test call
print(two_sum([2, 7, 11, 15], 9))
`,
  java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Solution running");
    }
}
`,
  cpp: `#include <iostream>
#include <vector>

int main() {
    std::cout << "Solution running" << std::endl;
    return 0;
}
`,
};

export function CodingSandbox({
  problemStatement,
  starterCode,
  testCases = [],
  defaultLanguage = "python",
  onSolutionSubmitted,
}: CodingSandboxProps) {
  const [language, setLanguage] = useState(defaultLanguage.toLowerCase());
  const [code, setCode] = useState(starterCode || DEFAULT_SNIPPETS[language] || DEFAULT_SNIPPETS.python);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);
  const [codeReview, setCodeReview] = useState<CodeReviewResponse | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"output" | "testcases" | "review">("output");

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(DEFAULT_SNIPPETS[newLang] || "");
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveBottomTab("output");
    try {
      const res = await ApiClient.executeCode(language, code);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        language,
        output: "",
        error: err.message || "Execution failed",
        exit_code: 1,
        execution_time_ms: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    try {
      // Execute first
      const execRes = await ApiClient.executeCode(language, code);
      setExecutionResult(execRes);

      // AI Code Review
      const reviewRes = await ApiClient.reviewCode(
        problemStatement,
        code,
        language,
        execRes.output || execRes.error || ""
      );
      setCodeReview(reviewRes);
      setActiveBottomTab("review");
      onSolutionSubmitted?.(code, reviewRes);
    } catch (err: any) {
      alert("Submission review error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md overflow-hidden">
      {/* Top Bar: Language & Actions */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Monaco Sandbox</span>
          </span>

          <select suppressHydrationWarning
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button suppressHydrationWarning
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRunning ? "Running..." : "Run Code"}</span>
          </button>

          <button suppressHydrationWarning
            type="button"
            onClick={handleSubmitSolution}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Reviewing..." : "Submit Solution"}</span>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-[280px]">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(val) => setCode(val || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Bottom Output & Review Console */}
      <div className="border-t border-slate-800 bg-slate-950/80 flex flex-col h-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 text-xs font-semibold text-slate-400">
          <div className="flex">
            <button suppressHydrationWarning
              onClick={() => setActiveBottomTab("output")}
              className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                activeBottomTab === "output"
                  ? "border-indigo-500 text-white"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal Output</span>
            </button>

            <button suppressHydrationWarning
              onClick={() => setActiveBottomTab("testcases")}
              className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                activeBottomTab === "testcases"
                  ? "border-indigo-500 text-white"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Test Cases ({testCases.length})</span>
            </button>

            {codeReview && (
              <button suppressHydrationWarning
                onClick={() => setActiveBottomTab("review")}
                className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeBottomTab === "review"
                    ? "border-indigo-500 text-white"
                    : "border-transparent hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Code Review ({codeReview.score}/10)</span>
              </button>
            )}
          </div>

          {executionResult && (
            <span className="text-[11px] font-mono text-slate-500">
              {executionResult.execution_time_ms}ms • Exit {executionResult.exit_code}
            </span>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
          {activeBottomTab === "output" ? (
            executionResult ? (
              <div>
                {executionResult.output && (
                  <pre className="text-slate-200 whitespace-pre-wrap">{executionResult.output}</pre>
                )}
                {executionResult.error && (
                  <pre className="text-rose-400 whitespace-pre-wrap mt-1">{executionResult.error}</pre>
                )}
              </div>
            ) : (
              <span className="text-slate-600">Click "Run Code" to view stdout / stderr here.</span>
            )
          ) : activeBottomTab === "testcases" ? (
            <div className="space-y-2">
              {testCases.length > 0 ? (
                testCases.map((tc, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                    <span className="text-slate-400">Input: </span>
                    <span className="text-slate-200">{tc.input}</span>
                    <span className="text-slate-400 ml-4">Expected: </span>
                    <span className="text-emerald-400">{tc.expected}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 font-sans">No predefined test cases. You can test your code using print/console.log statements.</span>
              )}
            </div>
          ) : codeReview ? (
            <div className="font-sans text-xs space-y-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
                <span>Time: <strong className="text-indigo-400">{codeReview.time_complexity}</strong></span>
                <span>Space: <strong className="text-purple-400">{codeReview.space_complexity}</strong></span>
                <span>Score: <strong className="text-emerald-400">{codeReview.score} / 10</strong></span>
              </div>
              <p className="text-slate-300">{codeReview.code_quality}</p>
              {codeReview.suggested_improvements?.length > 0 && (
                <div className="mt-1">
                  <span className="text-indigo-300 font-semibold block">Improvements:</span>
                  <ul className="list-disc pl-4 text-slate-400 space-y-0.5 mt-0.5">
                    {codeReview.suggested_improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
