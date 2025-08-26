import * as React from "react"
import { Input } from "./input"
import { formatNumberWithCommas, removeCommas, parseFormattedNumber } from "@/utils/numberFormat"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'type' | 'value' | 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  maxDecimals?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, allowDecimals = true, maxDecimals = 2, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      const stringValue = String(value || '');
      return formatNumberWithCommas(stringValue);
    });

    // Update display value when external value changes
    React.useEffect(() => {
      const stringValue = String(value || '');
      if (removeCommas(displayValue) !== stringValue) {
        setDisplayValue(formatNumberWithCommas(stringValue));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove any non-numeric characters except decimal point and commas
      inputValue = inputValue.replace(/[^\d.,]/g, '');
      
      // Handle decimal places
      if (allowDecimals) {
        const decimalIndex = inputValue.indexOf('.');
        if (decimalIndex !== -1) {
          // Limit decimal places
          const beforeDecimal = inputValue.substring(0, decimalIndex);
          const afterDecimal = inputValue.substring(decimalIndex + 1, decimalIndex + 1 + maxDecimals);
          inputValue = beforeDecimal + '.' + afterDecimal;
        }
      } else {
        // Remove decimal point if not allowed
        inputValue = inputValue.replace(/\./g, '');
      }
      
      // Format with commas
      const formatted = formatNumberWithCommas(inputValue);
      setDisplayValue(formatted);
      
      // Pass back the clean numeric value
      onChange(removeCommas(inputValue));
    };

    return (
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        className={cn(className)}
        ref={ref}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };