"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const PENDING = Symbol("pending");

interface CheckoutContextValue {
  summaryContent: ReactNode | typeof PENDING;
  setSummaryContent: (content: ReactNode) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined,
);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [summaryContent, setSummaryContent] = useState<
    ReactNode | typeof PENDING
  >(PENDING);

  const value = useMemo<CheckoutContextValue>(
    () => ({ summaryContent, setSummaryContent }),
    [summaryContent],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}

function CheckoutSummarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Separator />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutSummary() {
  const { summaryContent } = useCheckout();
  if (summaryContent === PENDING) return <CheckoutSummarySkeleton />;
  return <>{summaryContent}</>;
}
