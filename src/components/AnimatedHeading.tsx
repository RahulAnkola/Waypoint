"use client";

import type { ElementType } from "react";

interface Props {
  text: string;
  /** Optional second segment rendered after `text` with the animated gradient. */
  gradientText?: string;
  as?: ElementType;
  className?: string;
  /** Base delay (ms) applied to the first word. */
  delay?: number;
  /** Per-word stagger (ms). */
  stagger?: number;
}

export default function AnimatedHeading({
  text,
  gradientText,
  as: Tag = "h1",
  className = "",
  delay = 0,
  stagger = 80,
}: Props) {
  const segments: { word: string; gradient: boolean }[] = [
    ...text.split(" ").map((word) => ({ word, gradient: false })),
    ...(gradientText
      ? gradientText.split(" ").map((word) => ({ word, gradient: true }))
      : []),
  ];

  return (
    <Tag className={className}>
      {segments.map(({ word, gradient }, i) => (
        <span
          key={`${word}-${i}`}
          className={`inline-block animate-word-in ${
            gradient ? "text-gradient-animated" : ""
          }`}
          style={{ animationDelay: `${delay + i * stagger}ms` }}
        >
          {word}
          {i < segments.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
