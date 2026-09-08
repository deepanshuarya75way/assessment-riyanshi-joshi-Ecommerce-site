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
  const baseClasses = "inline-flex items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700",
    link:
      "text-indigo-600 underline-offset-4 hover:text-indigo-800",
    outline:
      "border-2 border-slate-300 text-slate-600 hover:bg-slate-50",
  }[variant] || "bg-indigo-600 text-white";

  const sizeClasses = {
    small: "h-8 px-2 rounded-md text-xs",
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