import React, { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/features/ui/components/ui/select";

interface ModelSelectProps {
  value: number;
  onChange: (value: number) => void;
  placeholder: string;
  options: { value: number; label: string }[];
}

const ModelSelect: React.FC<ModelSelectProps> = ({ value, onChange, placeholder, options }) => {
  const [open, setOpen] = useState(false);

  const allOptions = [{ value: -1, label: "Automatic" }, ...options];

  return (
    <Select
      value={value !== undefined ? value.toString() : "-1"}
      onValueChange={val => onChange(Number(val))}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="cursor-pointer w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="cursor-pointer">
        {allOptions.map(opt => (
          <SelectItem className="cursor-pointer" key={opt.value} value={opt.value.toString()}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelect; 