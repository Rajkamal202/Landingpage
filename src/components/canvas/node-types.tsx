"use client";

import * as React from "react";
import type { NodeProps, NodeTypes } from "@xyflow/react";
import type { CanvasFlowNode } from "./flow-types";
import {
  ComposeBody,
  ImageGenBody,
  OutputBody,
  PromptBody,
  SourceBody,
  VideoGenBody,
  VoiceBody,
} from "./node-bodies";
import { NodeShell } from "./node-shell";

/**
 * One renderer per node kind (SPEC §8.4 — entirely custom, no default node
 * styling anywhere).
 *
 * Each is memoised, and the flow node's `data` object identity is held stable
 * per document node upstream, so dragging one node re-renders one node rather
 * than the whole graph.
 *
 * The `kind` guard inside each renderer is what lets the body components take
 * a narrowed `CanvasNode` and keeps the discriminated union honest end to
 * end. React Flow routes `type` to the matching entry in `nodeTypes`, so the
 * guard is never actually false.
 */

const SourceNode = React.memo(function SourceNode({ data, selected }: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "source") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <SourceBody node={node} />
    </NodeShell>
  );
});

const PromptNode = React.memo(function PromptNode({ data, selected }: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "prompt") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <PromptBody node={node} />
    </NodeShell>
  );
});

const ImageGenNode = React.memo(function ImageGenNode({
  data,
  selected,
}: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "image-gen") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <ImageGenBody node={node} />
    </NodeShell>
  );
});

const VideoGenNode = React.memo(function VideoGenNode({
  data,
  selected,
}: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "video-gen") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <VideoGenBody node={node} />
    </NodeShell>
  );
});

const VoiceNode = React.memo(function VoiceNode({ data, selected }: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "voice") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <VoiceBody node={node} />
    </NodeShell>
  );
});

const ComposeNode = React.memo(function ComposeNode({ data, selected }: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "compose") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <ComposeBody node={node} />
    </NodeShell>
  );
});

const OutputNode = React.memo(function OutputNode({ data, selected }: NodeProps<CanvasFlowNode>) {
  const { node } = data;
  if (node.kind !== "output") return null;
  return (
    <NodeShell node={node} selected={selected === true}>
      <OutputBody node={node} />
    </NodeShell>
  );
});

export const nodeTypes: NodeTypes = {
  source: SourceNode,
  prompt: PromptNode,
  "image-gen": ImageGenNode,
  "video-gen": VideoGenNode,
  voice: VoiceNode,
  compose: ComposeNode,
  output: OutputNode,
};
