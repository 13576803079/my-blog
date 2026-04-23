/**
 * Tiptap 富文本编辑器组件
 *
 * 真正的所见即所得编辑体验：
 * - 工具栏按钮（标题、粗体、斜体、链接、引用、代码块、列表等）
 * - Enter 自然换行，块级元素独立显示
 * - 输出 Markdown 文本，兼容现有存储格式
 * - 使用 tiptap-markdown 实现 HTML ↔ Markdown 互转
 */

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// 工具栏按钮配置
const toolbarButtons = [
  {
    label: "H1",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("heading", { level: 1 }),
    className: "font-bold text-lg",
  },
  {
    label: "H2",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("heading", { level: 2 }),
    className: "font-bold text-base",
  },
  {
    label: "H3",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("heading", { level: 3 }),
    className: "font-bold text-sm",
  },
  { type: "divider" as const },
  {
    label: "B",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleBold().run(),
    isActive: (editor: ReturnType<typeof useEditor>) => editor?.isActive("bold"),
    className: "font-bold",
  },
  {
    label: "I",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleItalic().run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("italic"),
    className: "italic",
  },
  {
    label: "S",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleStrike().run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("strike"),
    className: "line-through",
  },
  {
    label: "< />",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleCodeBlock().run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("codeBlock"),
  },
  { type: "divider" as const },
  {
    label: "引用",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleBlockquote().run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("blockquote"),
  },
  {
    label: "无序列表",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleBulletList().run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("bulletList"),
  },
  {
    label: "有序列表",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleOrderedList().run(),
    isActive: (editor: ReturnType<typeof useEditor>) =>
      editor?.isActive("orderedList"),
  },
  { type: "divider" as const },
  {
    label: "分割线",
    action: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
  },
] as const;

type ToolbarItem =
  | { type: "divider" }
  | {
      label: string;
      action: (editor: ReturnType<typeof useEditor>) => void;
      isActive: (editor: ReturnType<typeof useEditor>) => boolean | undefined;
      className?: string;
    };

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "开始写你的文章...",
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    // 初始内容从 markdown 转换
    content: value,
    onUpdate: ({ editor: e }) => {
      // 编辑器内容变化时，输出 markdown 文本
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (e.storage as any).markdown.getMarkdown();
      onChange(md);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-gray max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
    },
  });

  // 外部 value 变化时同步（编辑页回填数据）
  useEffect(() => {
    if (editor && value === "") {
      editor.commands.setContent("");
    }
    // 只在外部数据源变化时触发，不监听 editor 自身的变化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === "" ? "__empty__" : undefined]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      {/* 工具栏 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        {(toolbarButtons as readonly ToolbarItem[]).map((item, i) => {
          if ("type" in item && item.type === "divider") {
            return (
              <div
                key={i}
                className="w-px h-5 bg-gray-300 mx-1"
              />
            );
          }

          const btn = item as {
            label: string;
            action: (e: typeof editor) => void;
            isActive: (e: typeof editor) => boolean | undefined;
            className?: string;
          };

          return (
            <button
              key={i}
              type="button"
              onClick={() => btn.action(editor)}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 transition-colors ${
                btn.isActive(editor)
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600"
              } ${btn.className || ""}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />
    </div>
  );
}
