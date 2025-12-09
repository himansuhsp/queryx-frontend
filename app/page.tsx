"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Level = "basic" | "advanced";
type Style = "detailed" | "short";
type Language = "english" | "hinglish";

interface AnswerResponse {
  answer_text: string;
}

// Backend URL hard-coded: FastAPI local dev
const BACKEND_URL = "http://127.0.0.1:8000";

const DAILY_LIMIT = 10;

export default function Page() {
  // toggles
  const [level, setLevel] = useState<Level>("basic");
  const [style, setStyle] = useState<Style>("detailed");
  const [language, setLanguage] = useState<Language>("hinglish");

  // IO
  const [questionText, setQuestionText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // UI state
  const [answerText, setAnswerText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);

  // theme + feedback
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

  // ---------- DAILY LIMIT LOAD ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("qx_daily_usage");
      const today = new Date().toISOString().slice(0, 10);

      if (!raw) {
        localStorage.setItem(
          "qx_daily_usage",
          JSON.stringify({ date: today, count: 0 })
        );
        return;
      }

      const parsed = JSON.parse(raw) as { date: string; count: number };

      if (parsed.date === today) {
        setQuestionsUsed(parsed.count);
      } else {
        localStorage.setItem(
          "qx_daily_usage",
          JSON.stringify({ date: today, count: 0 })
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const saveUsage = (next: number) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        "qx_daily_usage",
        JSON.stringify({ date: today, count: next })
      );
    } catch {
      // ignore
    }
  };

  const incrementUsage = () => {
    const next = Math.min(DAILY_LIMIT, questionsUsed + 1);
    setQuestionsUsed(next);
    saveUsage(next);
  };

  const limitReached = questionsUsed >= DAILY_LIMIT;

  // ---------- THEME LOAD ----------
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qx_theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("qx_theme", next);
    } catch {
      // ignore
    }
  };

  // ---------- HANDLERS ----------

  const handleQuestionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionText(e.target.value);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleAskText = async () => {
    setErrorMsg("");
    setCopyMsg("");
    setAnswerText("");

    if (!questionText.trim()) {
      setErrorMsg("Please type a question first.");
      return;
    }

    if (limitReached) {
      setErrorMsg("Daily free limit of 10 questions is over for today.");
      return;
    }

    setIsLoadingText(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/ask-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText.trim(),
          level,
          style,
          language,
        }),
      });

      if (!resp.ok) {
        setErrorMsg(`Server error (${resp.status}).`);
      } else {
        const data = (await resp.json()) as AnswerResponse;
        const text = (data && data.answer_text) || "";

        if (!text) {
          setErrorMsg("Empty response from backend.");
        } else {
          setAnswerText(text);
          incrementUsage();
        }
      }
    } catch (err) {
      console.error("Error in /ask-text:", err);
      setErrorMsg("Unable to reach backend. Check if backend is running.");
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleAskImage = async () => {
    setErrorMsg("");
    setCopyMsg("");
    setAnswerText("");

    if (!imageFile) {
      setErrorMsg("Please select an image first.");
      return;
    }

    if (limitReached) {
      setErrorMsg("Daily free limit of 10 questions is over for today.");
      return;
    }

    setIsLoadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("level", level);
      formData.append("style", style);
      formData.append("language", language);

      const resp = await fetch(`${BACKEND_URL}/ask-image`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        setErrorMsg(`Server error (${resp.status}).`);
      } else {
        const data = (await resp.json()) as AnswerResponse;
        const text = (data && data.answer_text) || "";

        if (!text) {
          setErrorMsg("Empty response from backend.");
        } else {
          setAnswerText(text);
          incrementUsage();
        }
      }
    } catch (err) {
      console.error("Error in /ask-image:", err);
      setErrorMsg("Unable to reach backend. Check if backend is running.");
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleCopyAnswer = async () => {
    if (!answerText.trim()) return;
    setCopyMsg("");

    try {
      await navigator.clipboard.writeText(answerText);
      setCopyMsg("Answer copied to clipboard.");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch (err) {
      console.error(err);
      setCopyMsg("Copy failed. You can select and copy manually.");
    }
  };

  const handleClearAll = () => {
    setQuestionText("");
    setImageFile(null);
    setAnswerText("");
    setErrorMsg("");
    setCopyMsg("");
    setFeedbackText("");
    setFeedbackStatus("");
  };

  const handleFeedbackSubmit = () => {
    setFeedbackStatus("");
    if (!feedbackText.trim()) {
      setFeedbackStatus("Please write something before submitting.");
      return;
    }

    setFeedbackStatus("Thanks for your suggestion! 💡");
    setFeedbackText("");
    setTimeout(() => setFeedbackStatus(""), 3000);
  };

  // ---------- LABELS & CLASSES ----------

  const isLoading = isLoadingText || isLoadingImage;

  const levelLabel = level === "basic" ? "Basic" : "Advanced";
  const styleLabel = style === "detailed" ? "Detailed" : "Short";
  const languageLabel = language === "english" ? "English" : "Hinglish";

  const mainClass =
    theme === "dark"
      ? "min-h-screen flex justify-center px-3 py-6 bg-slate-900 text-slate-100 transition-colors"
      : "min-h-screen flex justify-center px-3 py-6 bg-slate-100 text-slate-900 transition-colors";

  const cardClass =
    theme === "dark"
      ? "w-full max-w-4xl rounded-2xl shadow-md border px-6 py-5 bg-slate-800 border-slate-700 transition-colors"
      : "w-full max-w-4xl rounded-2xl shadow-md border px-6 py-5 bg-white border-slate-200 transition-colors";

  const softPanel =
    theme === "dark"
      ? "bg-slate-800 border border-slate-700 rounded-xl p-3"
      : "bg-slate-50 border border-slate-200 rounded-xl p-3";

  const textareaClass =
    theme === "dark"
      ? "w-full rounded-xl border border-slate-700 px-3 py-2 text-sm bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      : "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const answerBoxClass =
    theme === "dark"
      ? "min-h-[160px] max-h-[460px] overflow-y-auto border border-slate-700 bg-slate-900 rounded-xl px-4 py-3 transition-colors"
      : "min-h-[160px] max-h-[460px] overflow-y-auto border border-slate-300 bg-white rounded-xl px-4 py-3 transition-colors";

  const proseClass =
    theme === "dark"
      ? "prose prose-sm prose-invert max-w-none leading-relaxed"
      : "prose prose-sm max-w-none leading-relaxed";

  const pillClasses = (active: boolean) =>
    [
      "px-4 py-1 rounded-full text-sm font-medium border transition",
      active
        ? theme === "dark"
          ? "bg-blue-500 text-white border-blue-500 shadow-sm"
          : "bg-blue-600 text-white border-blue-600 shadow-sm"
        : theme === "dark"
        ? "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
    ].join(" ");

  const neutralButton =
    theme === "dark"
      ? "px-3 py-1 rounded-full text-[11px] font-medium border bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
      : "px-3 py-1 rounded-full text-[11px] font-medium border bg-white text-slate-600 border-slate-300 hover:bg-slate-50";

  const smallBadge =
    theme === "dark"
      ? "inline-flex items-center rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300"
      : "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600";

  const feedbackBoxClass =
    theme === "dark"
      ? "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      : "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const blueBtn =
    theme === "dark"
      ? "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm bg-blue-500 hover:bg-blue-600 text-white"
      : "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white";

  const greenBtn =
    theme === "dark"
      ? "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white"
      : "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white";

  const feedbackTextLabel =
    theme === "dark" ? "text-slate-300" : "text-slate-700";

  // ---------- UI ----------

  return (
    <main className={mainClass}>
      <div className={cardClass}>
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold">QueryX</h1>
            <p className="text-xs text-slate-400">
              Powered by{" "}
              <span className="font-semibold">X-Precision Engine™</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={neutralButton}
            >
              {theme === "dark" ? "🌙 Night" : "☀️ Light"} · Toggle
            </button>

            <p className="text-xs text-slate-400">
              {questionsUsed} / {DAILY_LIMIT} free questions used today
            </p>
          </div>
        </header>

        {/* TOGGLES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {/* Level */}
          <div className={softPanel}>
            <p className="text-xs font-semibold mb-2 text-slate-400">Level</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLevel("basic")}
                className={pillClasses(level === "basic")}
              >
                Basic
              </button>
              <button
                type="button"
                onClick={() => setLevel("advanced")}
                className={pillClasses(level === "advanced")}
              >
                Advanced
              </button>
            </div>
          </div>

          {/* Style */}
          <div className={softPanel}>
            <p className="text-xs font-semibold mb-2 text-slate-400">Style</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStyle("detailed")}
                className={pillClasses(style === "detailed")}
              >
                Detailed
              </button>
              <button
                type="button"
                onClick={() => setStyle("short")}
                className={pillClasses(style === "short")}
              >
                Short
              </button>
            </div>
          </div>

          {/* Language */}
          <div className={softPanel}>
            <p className="text-xs font-semibold mb-2 text-slate-400">
              Language
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage("english")}
                className={pillClasses(language === "english")}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hinglish")}
                className={pillClasses(language === "hinglish")}
              >
                Hinglish
              </button>
            </div>
          </div>
        </section>

        {/* TEXT QUESTION */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-sm font-semibold">Enter your question</p>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] underline decoration-dotted text-slate-400 hover:text-slate-300"
            >
              Clear question & answer
            </button>
          </div>

          <textarea
            value={questionText}
            onChange={handleQuestionChange}
            rows={4}
            className={textareaClass}
            placeholder="e.g. A 2 kg block is pulled by a force F = 2t on a smooth surface. Find the work done by F in 4 seconds."
          />
          <div className="mt-3 flex justify-start">
            <button
              type="button"
              onClick={handleAskText}
              disabled={isLoadingText || limitReached}
              className={
                (isLoadingText || limitReached
                  ? "opacity-60 cursor-not-allowed "
                  : "") + blueBtn
              }
            >
              {isLoadingText && (
                <span className="mr-2 h-3 w-3 rounded-full border-2 border-white border-t-transparent inline-block animate-spin" />
              )}
              {isLoadingText ? "Solving..." : "Ask (Text)"}
            </button>
          </div>
        </section>

        {/* IMAGE QUESTION */}
        <section className="mb-5">
          <p className="text-sm font-semibold mb-1">Or upload a question image</p>
          <p className="text-[11px] text-slate-400 mb-2">
            Clear photo of the full question. Avoid blur / low light.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs"
            />
            <button
              type="button"
              onClick={handleAskImage}
              disabled={isLoadingImage || limitReached}
              className={
                (isLoadingImage || limitReached
                  ? "opacity-60 cursor-not-allowed "
                  : "") + greenBtn
              }
            >
              {isLoadingImage && (
                <span className="mr-2 h-3 w-3 rounded-full border-2 border-white border-t-transparent inline-block animate-spin" />
              )}
              {isLoadingImage ? "Solving..." : "Ask (Image)"}
            </button>
          </div>
        </section>

        {/* ANSWER */}
        <section className="border-t border-slate-700/60 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <p className="text-sm font-semibold">Answer:</p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className={smallBadge}>
                {levelLabel} · {styleLabel} · {languageLabel}
              </span>

              {/* Quick actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  disabled={!answerText || isLoading}
                  className={
                    (!answerText || isLoading
                      ? "opacity-60 cursor-not-allowed "
                      : "") + neutralButton
                  }
                >
                  Copy answer
                </button>

                {/* NEW: Clear answer button */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isLoading}
                  className={
                    (isLoading ? "opacity-60 cursor-not-allowed " : "") +
                    neutralButton
                  }
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className={answerBoxClass}>
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-slate-700/60 rounded" />
                <div className="h-3 bg-slate-700/60 rounded w-11/12" />
                <div className="h-3 bg-slate-700/60 rounded w-10/12" />
                <div className="h-3 bg-slate-700/60 rounded w-9/12" />
              </div>
            ) : answerText ? (
              <div className={proseClass}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath as any]}
                  rehypePlugins={[rehypeKatex as any]}
                >
                  {answerText}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Your answer will appear here.
              </p>
            )}
          </div>

          {copyMsg && (
            <p className="mt-2 text-[11px] text-emerald-400">{copyMsg}</p>
          )}

          {errorMsg && (
            <p className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </p>
          )}
        </section>

        {/* FEEDBACK / SUGGESTION BOX */}
        <section className="mt-5 border-t border-slate-700/60 pt-4">
          <p className={`text-sm font-semibold mb-1 ${feedbackTextLabel}`}>
            Feature suggestion / feedback
          </p>
          <p className="text-[11px] text-slate-400 mb-2">
            Koi naya feature idea hai ya QueryX ko better kaise banayein? Yahan
            likho 👇
          </p>

          <textarea
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className={feedbackBoxClass}
            placeholder="e.g. Graphs for SHM, pure Hindi mode, previous answer history, etc."
          />

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleFeedbackSubmit}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
            >
              Submit suggestion
            </button>

            {feedbackStatus && (
              <p className="text-[11px] text-slate-400">{feedbackStatus}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
