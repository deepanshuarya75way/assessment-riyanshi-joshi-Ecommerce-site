import React from "react";

const Button = ({
  variant = "primary",
  size = "",
  width = "",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:translate-y-px",
    link:
      "text-indigo-600 underline-offset-4 hover:text-indigo-800",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px",
  }[variant] || "bg-indigo-600 text-white";

  const sizeClasses = {
    sm: "min-h-10 px-3 rounded-lg text-xs",
    small: "min-h-10 px-3 rounded-lg text-xs",
    medium: "h-10 px-4",
    large: "h-12 px-6",
  }[size] || "";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${width ? "w-full" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;