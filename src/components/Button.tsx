import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonOnlyProps = {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
};

type LinkOnlyProps = {
  href: string;
  target?: string;
  rel?: string;
};

type ButtonProps = CommonProps & (ButtonOnlyProps | LinkOnlyProps);

function buttonClass({ variant = "primary", size = "md", block = false, className }: CommonProps): string {
  return [
    "btn",
    variant === "outline" ? "btn-outline" : "btn-primary",
    size === "lg" && "btn-lg",
    block && "btn-block",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Shared button. Renders an <a> (Next Link) when `href` is set, else a <button>. */
export default function Button(props: ButtonProps) {
  const className = buttonClass(props);

  if (props.href !== undefined) {
    return (
      <Link href={props.href} target={props.target} rel={props.rel} className={className}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={className}
    >
      {props.children}
    </button>
  );
}
