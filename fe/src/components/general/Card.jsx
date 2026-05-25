import { forwardRef } from "react";

const Card = forwardRef(
  ({ as: Component = "div", className = "", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)] sm:p-8 text-black dark:text-white ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Card.displayName = "Card";
export default Card;
