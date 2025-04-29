import { BaseToolView, ToolCall } from "./BaseToolView";

interface ScriptGenerationToolViewProps {
  tool: ToolCall;
}

export function ScriptGenerationToolView({
  tool,
}: ScriptGenerationToolViewProps) {
  let sectionsCount = 0;

  try {
    const scriptData =
      typeof tool.args === "string" ? JSON.parse(tool.args) : tool.args;

    sectionsCount = scriptData?.sections?.length || 0;
  } catch (e) {
    console.error("Error parsing tool args:", e);
  }

  return (
    <BaseToolView tool={tool}>
      <div className="mt-1 overflow-hidden text-ellipsis">
        <div className="text-2xs text-muted-foreground">
          Sections: {sectionsCount}
        </div>
      </div>
    </BaseToolView>
  );
}
