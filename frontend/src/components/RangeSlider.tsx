interface RangeSliderProps {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

export default function RangeSlider({ start, end, onChange }: RangeSliderProps) {
  return (
    <div className="range-slider">
      <div className="range-slider__track" />
      <div
        className="range-slider__range"
        style={{ left: `${start}%`, width: `${end - start}%` }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={start}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(Math.min(v, end), end);
        }}
        className="range-slider__input range-slider__input--start"
        style={{ zIndex: start > end - 10 ? 5 : 3 }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={end}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(start, Math.max(v, start));
        }}
        className="range-slider__input range-slider__input--end"
        style={{ zIndex: start > end - 10 ? 3 : 5 }}
      />
    </div>
  );
}
