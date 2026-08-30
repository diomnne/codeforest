import { RANGE_OPTIONS, type RangeKey } from "@/lib/types";
import { Button, Segmented } from "./ui";

type Props = {
  range: RangeKey;
  metricsHidden: boolean;
  onRangeChange: (range: RangeKey) => void;
  onToggleMetrics: () => void;
};

export default function Controls({
  range,
  metricsHidden,
  onRangeChange,
  onToggleMetrics,
}: Props) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-4">
      <Segmented
        label="Date range"
        value={range}
        options={RANGE_OPTIONS}
        onChange={onRangeChange}
      />

      <Button
        type="button"
        onClick={onToggleMetrics}
        aria-pressed={!metricsHidden}
      >
        {metricsHidden ? "Show metrics" : "Hide metrics"}
      </Button>
    </div>
  );
}
