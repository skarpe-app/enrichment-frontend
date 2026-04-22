import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Floating-label input for auth pages.
 * Label animates up and shrinks on focus or when pre-filled.
 * Uses the .field / .field-label / .field-leading / .field-trailing classes in index.css.
 *
 * Critical: placeholder=" " (single space) must stay — drives the :not(:placeholder-shown) CSS trick.
 */
export const FloatingField = forwardRef<HTMLInputElement, Props>(
  ({ label, leading, trailing, wrapperClassName, id, ...rest }, ref) => {
    const inputId = id || `ff-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className={cn('field', leading && 'has-leading', wrapperClassName)}>
        {leading && <span className="field-leading">{leading}</span>}
        <input ref={ref} id={inputId} placeholder=" " {...rest} />
        <label htmlFor={inputId} className="field-label">{label}</label>
        {trailing && <span className="field-trailing">{trailing}</span>}
      </div>
    );
  }
);
FloatingField.displayName = 'FloatingField';
