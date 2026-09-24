import React, { useMemo } from "react";
import CategoryCascader from "./CategoryCascader";

interface ReportCategoryFilterProps {
  categories: { name: string; children: { name: string }[] }[];
  value: string;
  onChange: (value: string) => void;
}

export default function ReportCategoryFilter({ categories, value, onChange }: ReportCategoryFilterProps) {
  const categoryMap = useMemo(() => Object.fromEntries(categories.map(category =>
    [category.name, category.children.map(child => child.name)]
  )), [categories]);
  const primary = categories.find(category => category.name === value || category.children.some(child =>
    `${category.name} / ${child.name}` === value
  ));
  const secondary = primary?.children.find(child => `${primary.name} / ${child.name}` === value);

  return <div className="w-56 max-w-full">
    <CategoryCascader
      primaryCategory={primary?.name || ""}
      secondaryCategory={secondary?.name || ""}
      customCategoryMap={categoryMap}
      expandTrigger="click"
      ariaLabel="分类"
      placeholder="请选择分类"
      onSelect={(name, child) => onChange(child ? `${name} / ${child}` : name)}
      onClear={() => onChange("")}
    />
  </div>;
}
