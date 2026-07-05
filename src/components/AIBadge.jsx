import React from "react";
import HiveLogo from "@/components/HiveLogo";

export default function AIBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <HiveLogo size={20} />
    </span>
  );
}