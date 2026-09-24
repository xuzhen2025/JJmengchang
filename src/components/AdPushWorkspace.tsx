import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Trash2,
  TvMinimalPlay,
  X,
} from "lucide-react";
import OverlayPortal from "./overlays/OverlayPortal";
import AnchoredPopover from "./overlays/AnchoredPopover";
import { AdDialog, TemplateEditor } from "./AdPushDialogs";
import { useResourceConfig } from "../lib/useResourceConfig";
import { useAdStore } from "../lib/useAdStore";
import {
  adCatalog,
  adId,
  activeAdDerivationCount,
  createAdRecords,
  getAdActor,
  groupAdRows,
  isAdActive,
  readAdStore,
  saveAdTemplate,
  updateAdStore,
  visibleAdAccounts,
  type AdAccount,
  type AdDraft,
  type AdPushRecord,
  type AdTemplate,
  type AdVideo,
  type DeliveryRow,
} from "../lib/adPush";
import {
  AD_TARGETS,
  VIDEO_NAME_WORDS,
  companyVideoNaming,
  defaultWorkbench,
  readAdPushSettings,
  targetGoal,
  validateWorkbench,
  type AdTarget,
  type AdWorkbenchConfig,
} from "../lib/adPushConfig";
import "./AdPushWorkspace.css";
import { activeDerivationCount, derivationCount, useDerivationTasks, validateDerivationCount, type DerivationOptions } from "../lib/videoDerivation";

type Mode = "push" | "full_domain" | "single" | "multi";
const MODES: { key: Mode; label: string; description: string }[] = [
  { key: "push", label: "仅推送", description: "将视频推送到千川视频库" },
  {
    key: "full_domain",
    label: "全域推广",
    description: "投放新视频至全域推广计划",
  },
  {
    key: "single",
    label: "推送并搭建计划（单创意）",
    description: "每个计划一个视频创意，推送后根据模板搭建计划",
  },
  {
    key: "multi",
    label: "推送并搭建计划（多创意）",
    description: "每个计划多个视频创意，推送后根据模板搭建计划",
  },
];
const emptyRow = (accountId: string): DeliveryRow => ({
  id: adId(),
  accountId,
  douyinId: "",
  productId: "",
  storeId: "",
  planId: "",
});
const visitPreferences = new Map<
  string,
  {
    formats: { id: string; name: string; pattern: string }[];
    presets: { id: string; name: string; config: AdWorkbenchConfig }[];
    starred: string[];
  }
>();
const toggle = (values: string[], id: string) =>
  values.includes(id) ? values.filter((x) => x !== id) : [...values, id];
const Section = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <section className="ap-section">
    {title && <h2 className="ap-title">{title}</h2>}
    {children}
  </section>
);
const Row = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="ap-row">
    <div className="ap-label">{label}</div>
    <div className="ap-value">{children}</div>
  </div>
);
function Help({ children }: { children: React.ReactNode }) {
  const anchor = useRef<HTMLButtonElement>(null),
    [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        className="ap-help"
        aria-label="查看说明"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp size={13} />
      </button>
      {open && (
        <AnchoredPopover
          anchorRef={anchor}
          side="top"
          align="center"
          width={340}
          onClose={() => setOpen(false)}
          className="ad-push-ui ap-tooltip"
        >
          {children}
        </AnchoredPopover>
      )}
    </>
  );
}
function Choices({
  label,
  values,
  value,
  onChange,
  radio = false,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
  radio?: boolean;
}) {
  return (
    <div
      className={`ap-choices ${radio ? "is-radio" : ""}`}
      role="radiogroup"
      aria-label={label}
    >
      {values.map((v) => (
        <label key={v} className={value === v ? "is-active" : ""}>
          <input
            type="radio"
            name={`ap-${label}`}
            checked={value === v}
            onChange={() => onChange(v)}
          />
          <span>{v}</span>
        </label>
      ))}
    </div>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
  placeholder = "请选择",
}: {
  label: string;
  value: string;
  options: (string | { value: string; label: string })[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const anchor = useRef<HTMLButtonElement>(null),
    [open, setOpen] = useState(false);
  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <>
      <button
        type="button"
        className="ap-select"
        ref={anchor}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "" : "ap-muted"}>
          {items.find((o) => o.value === value)?.label || value || placeholder}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <AnchoredPopover
          anchorRef={anchor}
          matchAnchorWidth
          width={230}
          onClose={() => setOpen(false)}
          className="ad-push-ui ap-menu"
        >
          <div role="listbox" aria-label={label}>
            {items.map((o) => (
              <button
                role="option"
                aria-selected={value === o.value}
                key={o.value}
                className={value === o.value ? "is-active" : ""}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
                {value === o.value && <Check size={14} />}
              </button>
            ))}
            {!items.length && <div className="ap-empty">暂无数据</div>}
          </div>
        </AnchoredPopover>
      )}
    </>
  );
}
function Switch({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`ap-switch ${value ? "is-on" : ""}`}
      role="switch"
      aria-label={label}
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
    >
      <span />
    </button>
  );
}
function AccountPanel({
  accounts,
  selected,
  onSelect,
  active,
  onActivate,
}: {
  accounts: AdAccount[];
  selected: string[];
  onSelect?: (ids: string[]) => void;
  active?: string;
  onActivate?: (id: string) => void;
}) {
  const store = useAdStore(),
    actor = getAdActor();
  const [scope, setScope] = useState("收藏账户"),
    [search, setSearch] = useState(""),
    [group, setGroup] = useState(""),
    [category, setCategory] = useState("");
  const keywords = search
    .trim()
    .toLowerCase()
    .split(/[，,\s]+/)
    .filter(Boolean);
  const list = accounts.filter(
    (a) =>
      (scope !== "收藏账户" || a.isStarred) &&
      (scope !== "个人账户" ||
        a.user === actor.name ||
        a.authorizedBy === actor.name) &&
      (scope !== "小组账户" || a.group === actor.group) &&
      (scope !== "分类账户" || !category || a.category === category) &&
      (scope !== "公司分组" ||
        !group ||
        store.groups.find((g) => g.id === group)?.accountIds.includes(a.id)) &&
      (!keywords.length ||
        keywords.some((k) => `${a.name} ${a.id}`.toLowerCase().includes(k))),
  );
  const enabled = list.filter((a) => a.status === "authorized" && !a.revoked),
    checked =
      enabled.length > 0 && enabled.every((a) => selected.includes(a.id));
  return (
    <div className="ap-account-panel">
      <div className="ap-panel-heading ap-tabs">
        {[
          "收藏账户",
          ...(onSelect ? ["个人账户"] : []),
          "小组账户",
          "分类账户",
          "全部账户",
          "公司分组",
        ].map((s) => (
          <button
            key={s}
            className={scope === s ? "is-active" : ""}
            onClick={() => setScope(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="ap-account-search">
        <input
          aria-label="搜索广告账户"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="请输入账户名称/ID（ID支持多个，用逗号或换行隔开）"
        />
      </div>
      {scope === "分类账户" && (
        <div className="ap-account-filter">
          <Select
            label="账户分类"
            value={category}
            onChange={setCategory}
            options={[
              { label: "全部分类", value: "" },
              ...[...new Set(accounts.map((a) => a.category))].filter(Boolean),
            ]}
          />
        </div>
      )}
      {scope === "公司分组" && (
        <div className="ap-account-filter">
          <Select
            label="公司分组"
            value={group}
            onChange={setGroup}
            options={[
              { label: "全部分组", value: "" },
              ...store.groups
                .filter((g) => g.platform === "巨量千川")
                .map((g) => ({ label: g.name, value: g.id })),
            ]}
          />
        </div>
      )}
      {scope === "收藏账户" && (
        <div className="ap-favorite-heading">我的收藏</div>
      )}
      {onSelect && (
        <label className="ap-check-all">
          <input
            type="checkbox"
            aria-label="全选可用账户"
            ref={(el) => {
              if (el)
                el.indeterminate =
                  !checked && enabled.some((a) => selected.includes(a.id));
            }}
            checked={checked}
            onChange={(e) =>
              onSelect(
                e.target.checked
                  ? [...new Set([...selected, ...enabled.map((a) => a.id)])]
                  : selected.filter((id) => !enabled.some((a) => a.id === id)),
              )
            }
          />
          全选
        </label>
      )}
      <div className="ap-account-list">
        {list.map((a) => (
          <div
            key={a.id}
            className={`ap-account ${selected.includes(a.id) || active === a.id ? "is-active" : ""} ${a.status === "expired" || a.revoked ? "is-disabled" : ""}`}
          >
            {onSelect ? (
              <label>
                <input
                  aria-label={a.name}
                  type="checkbox"
                  disabled={a.status === "expired" || a.revoked}
                  checked={selected.includes(a.id)}
                  onChange={() => onSelect(toggle(selected, a.id))}
                />
                <span>
                  {a.name}
                  <small>
                    {a.id}
                    {a.status === "expired" && " · 已失效"}
                  </small>
                </span>
              </label>
            ) : (
              <button
                className="ap-account-name"
                disabled={a.status === "expired" || a.revoked}
                onClick={() => onActivate?.(a.id)}
              >
                {a.name}
                <small>
                  {a.id}
                  {a.status === "expired" && " · 已失效"}
                </small>
              </button>
            )}
            <button
              className="ap-icon"
              title={a.isStarred ? "取消收藏账户" : "收藏账户"}
              onClick={() =>
                updateAdStore((s) => ({
                  ...s,
                  accounts: s.accounts.map((x) =>
                    x.id === a.id ? { ...x, isStarred: !x.isStarred } : x,
                  ),
                }))
              }
            >
              <Star size={18} fill={a.isStarred ? "currentColor" : "none"} />
            </button>
          </div>
        ))}
        {!list.length && <div className="ap-empty">暂无数据</div>}
      </div>
    </div>
  );
}

function PlanPicker({
  accounts,
  goal,
  initial,
  reference = false,
  onClose,
  onConfirm,
}: {
  accounts: AdAccount[];
  goal: AdDraft["goal"];
  initial: DeliveryRow[];
  reference?: boolean;
  onClose: () => void;
  onConfirm: (rows: DeliveryRow[]) => void;
}) {
  const [active, setActive] = useState(
      accounts.find((a) => a.status === "authorized" && !a.revoked)?.id || "",
    ),
    [picked, setPicked] = useState(initial);
  const [bidding, setBidding] = useState("控成本投放"),
    [order, setOrder] = useState("倒序"),
    [sort, setSort] = useState("创建时间"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("所有(不含已删除)"),
    [page, setPage] = useState(1),
    [size, setSize] = useState(50);
  const a = accounts.find((a) => a.id === active),
    catalog = a && adCatalog(a);
  const plans = (catalog?.plans || [])
    .filter(
      (p) =>
        p.goal === goal &&
        p.name.includes(search) &&
        (p.bidding || "控成本投放") === bidding &&
        (status === "所有(不含已删除)" || p.status === status),
    )
    .sort((x, y) => {
      const key =
        sort === "整体消耗"
          ? "cost"
          : sort === "整体支付ROI"
            ? "roi"
            : sort === "整体成交金额"
              ? "revenue"
              : "createdAt";
      const xv = x[key] || 0,
        yv = y[key] || 0;
      return (
        (typeof xv === "number" && typeof yv === "number"
          ? xv - yv
          : String(xv).localeCompare(String(yv))) * (order === "倒序" ? -1 : 1)
      );
    });
  const rows = plans.slice((page - 1) * size, page * size);
  const choose = (plan: (typeof plans)[number]) => {
    const row = {
      ...emptyRow(active),
      douyinId: plan.douyinId,
      planId: plan.id,
    };
    setPicked((p) =>
      reference
        ? [row]
        : p.some((r) => r.planId === plan.id && r.accountId === active)
          ? p.filter((r) => r.planId !== plan.id || r.accountId !== active)
          : [...p, row],
    );
  };
  return (
    <AdDialog
      title={reference ? "引用已有计划" : "已有计划添加视频"}
      className="ad-push-ui ap-dialog"
      wide
      onClose={onClose}
      footer={
        <>
          <span className="ap-footer-count">
            已选：<b>{picked.length}</b> 个计划
          </span>
          <button className="ap-button" onClick={onClose}>
            取消
          </button>
          <button
            className="ap-button primary"
            disabled={!picked.length}
            onClick={() => onConfirm(picked)}
          >
            确定
          </button>
        </>
      }
    >
      <div className="ap-plan-picker">
        <AccountPanel
          accounts={accounts}
          selected={[]}
          active={active}
          onActivate={(id) => {
            setActive(id);
            setPage(1);
          }}
        />
        <div className="ap-plan-panel">
          <div className="ap-plan-caption">选择账户已有计划</div>
          <div className="ap-filters">
            {reference && (
              <input
                aria-label="搜索计划名称"
                placeholder="请输入名称"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            )}
            <Select
              label="投放方式"
              value={bidding}
              options={["控成本投放", "放量投放"]}
              onChange={(v) => {
                setBidding(v);
                setPage(1);
              }}
            />
            <Select
              label="排序方向"
              value={order}
              options={["倒序", "正序"]}
              onChange={setOrder}
            />
            <Select
              label="排序字段"
              value={sort}
              options={["创建时间", "整体消耗", "整体支付ROI", "整体成交金额"]}
              onChange={setSort}
            />
            {reference && (
              <Select
                label="计划状态"
                value={status}
                options={["所有(不含已删除)", "投放中", "已暂停"]}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              />
            )}
          </div>
          <div className="ap-table-scroll">
            <table className="ap-table">
              <thead>
                <tr>
                  <th></th>
                  <th>计划</th>
                  <th>抖音号</th>
                  <th>计划状态</th>
                  <th>整体消耗</th>
                  <th>整体支付ROI</th>
                  <th>整体成交金额</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        aria-label={`选择计划 ${p.name}`}
                        type={reference ? "radio" : "checkbox"}
                        checked={picked.some(
                          (r) => r.accountId === active && r.planId === p.id,
                        )}
                        onChange={() => choose(p)}
                      />
                    </td>
                    <td>
                      {p.name}
                      <small>{p.id}</small>
                    </td>
                    <td>
                      {catalog?.douyins.find((d) => d.id === p.douyinId)?.name}
                    </td>
                    <td>{p.status}</td>
                    <td>
                      {(p.cost || 0).toLocaleString("zh-CN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{(p.roi || 0).toFixed(2)}</td>
                    <td>
                      {(p.revenue || 0).toLocaleString("zh-CN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <div className="ap-empty">暂无数据</div>}
          </div>
          <div className="ap-pagination">
            <span>共 {plans.length} 条</span>
            <select
              aria-label="每页条数"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ‹
            </button>
            <b>{page}</b>
            <button
              disabled={page * size >= plans.length}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </AdDialog>
  );
}

export default function AdPushWorkspace({
  video,
  videos,
  initialDraft,
  deriveMode = false,
  onClose,
  onCreate,
}: {
  video: AdVideo;
  videos?: AdVideo[];
  initialDraft?: AdDraft;
  deriveMode?: boolean;
  onClose: () => void;
  onCreate: (records: AdPushRecord[]) => void;
}) {
  useDerivationTasks();
  const deriving = deriveMode || Boolean(initialDraft?.derivation);
  const [derivation, setDerivation] = useState<DerivationOptions>(initialDraft?.derivation || { allocation: "per_account", count: 1 });
  const store = useAdStore(),
    actor = getAdActor(),
    { store: resourceConfig } = useResourceConfig();
  const [mode, setMode] = useState<Mode>(
    initialDraft?.method === "plan"
      ? initialDraft.creative === "多创意"
        ? "multi"
        : "single"
      : initialDraft?.method || "push",
  );
  const [config, setConfig] = useState<AdWorkbenchConfig>(() => ({
    ...defaultWorkbench(),
    target: initialDraft?.goal === "推商品" ? "商品全域" : "直播全域",
    ...initialDraft?.workbench,
  }));
  const [draft, setDraft] = useState<AdDraft>(() =>
    initialDraft
      ? structuredClone(initialDraft)
      : {
          platform: "巨量千川",
          method: "push",
          goal: "推直播间",
          rows: [],
          templateIds: [],
          version: "转码后视频",
          naming: companyVideoNaming(),
          scheduledAt: "",
          creative: "单创意",
          successStatus: "已上机",
        },
  );
  const [dialog, setDialog] = useState<
    | "accounts"
    | "plans"
    | "reference"
    | "templates"
    | "naming"
    | "save"
    | "card"
    | "confirm"
    | null
  >(null);
  const [picked, setPicked] = useState<string[]>([]),
    [editor, setEditor] = useState<{ template?: AdTemplate } | null>(null),
    [deleting, setDeleting] = useState<AdTemplate | null>(null);
  const [scheduled, setScheduled] = useState(
      Boolean(initialDraft?.scheduledAt),
    ),
    [templateScope, setTemplateScope] = useState("公司模板"),
    [templateSearch, setTemplateSearch] = useState(""),
    [starred, setStarred] = useState<string[]>(
      () => visitPreferences.get(actor.id)?.starred || [],
    );
  const [formats, setFormats] = useState(
      () => visitPreferences.get(actor.id)?.formats || [],
    ),
    [formatName, setFormatName] = useState(""),
    [formatPattern, setFormatPattern] = useState(""),
    [deleteFormat, setDeleteFormat] = useState<string | null>(null);
  const [presets, setPresets] = useState(
      () => visitPreferences.get(actor.id)?.presets || [],
    ),
    [preset, setPreset] = useState(""),
    [saveName, setSaveName] = useState(""),
    [saveType, setSaveType] = useState<"preset" | "template">("preset"),
    [saveScope, setSaveScope] = useState("个人模板");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [referenceTemplate, setReferenceTemplate] = useState("");
  const [cardDraft, setCardDraft] = useState({ title: "", points: "" });
  const namingRef = useRef<HTMLInputElement>(null),
    [nameMenu, setNameMenu] = useState(false),
    mainRef = useRef<HTMLDivElement>(null),
    submitting = useRef(false);
  const canPlan = actor.permissions.includes("uc_ad_plan_manage"),
    accounts = visibleAdAccounts(store, actor).filter(
      (a) => a.platform === "巨量千川" && !a.revoked,
    );
  const goal = mode === "full_domain" ? targetGoal(config.target) : draft.goal;
  const isPlanMode = mode === "single" || mode === "multi",
    isCreate = mode === "full_domain" && config.operation === "create";
  const planCount = isCreate
    ? groupAdRows({ ...draft, method: "full_domain", workbench: config }).length
    : 0;
  const templates = store.templates.filter(
    (t) =>
      t.platform === "巨量千川" &&
      t.goal === goal &&
      (t.scope === "公司模板" || t.ownerId === actor.id),
  );
  const visibleTemplates = templates.filter(
    (t) =>
      (templateScope === "收藏模板"
        ? starred.includes(t.id)
        : t.scope === templateScope) && t.name.includes(templateSearch),
  );
  const selectedTemplates = templates.filter((t) =>
    draft.templateIds.includes(t.id),
  );
  useEffect(() => {
    visitPreferences.set(actor.id, { formats, presets, starred });
  }, [actor.id, formats, presets, starred]);
  useEffect(() => {
    if (
      !isPlanMode ||
      !draft.templateIds.some(
        (id) =>
          !store.templates.some(
            (t) =>
              t.id === id &&
              t.goal === goal &&
              t.platform === "巨量千川" &&
              (t.scope === "公司模板" || t.ownerId === actor.id),
          ),
      )
    )
      return;
    setDraft((d) => ({
      ...d,
      templateIds: d.templateIds.filter((id) =>
        store.templates.some(
          (t) =>
            t.id === id &&
            t.goal === goal &&
            t.platform === "巨量千川" &&
            (t.scope === "公司模板" || t.ownerId === actor.id),
        ),
      ),
    }));
    setNotice("原模板已删除或不再适用，请重新选择模板");
  }, [actor.id, draft.templateIds, goal, isPlanMode, store.templates]);
  const settings = readAdPushSettings(),
    activeCount = store.records.filter(
      (r) => r.operatorId === actor.id && isAdActive(r),
    ).length;
  const change = (patch: Partial<AdDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
    setNotice("");
  };
  const set = <K extends keyof AdWorkbenchConfig>(
    key: K,
    value: AdWorkbenchConfig[K],
  ) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setError("");
  };
  const updateRow = (id: string, patch: Partial<DeliveryRow>) =>
    change({
      rows: draft.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  const switchMode = (next: Mode) => {
    setMode(next);
    change({ rows: [], templateIds: [], goal: "推商品" });
    setDialog(null);
    setConfig(defaultWorkbench());
    setPreset("");
  };
  const selectTarget = (target: AdTarget) => {
    setConfig((c) => ({
      ...c,
      target,
      operation: "append",
      bidding: target === "商品乘方" ? "控成本投放" : c.bidding,
      grouping: target === "商品乘方" ? "每个商品一条计划" : "一个计划一个商品",
    }));
    change({ goal: targetGoal(target), rows: [], templateIds: [] });
    setPreset("");
  };
  const openAccounts = () => {
    setPicked([...new Set(draft.rows.map((r) => r.accountId))]);
    setDialog("accounts");
  };
  const replaceAccounts = (ids: string[]) =>
    change({
      rows: ids.flatMap((id) =>
        draft.rows.filter((r) => r.accountId === id).length
          ? draft.rows.filter((r) => r.accountId === id)
          : [emptyRow(id)],
      ),
    });
  const insertWord = (word: string) => {
    const start = namingRef.current?.selectionStart ?? draft.naming.length,
      end = namingRef.current?.selectionEnd ?? start;
    change({
      naming:
        draft.naming.slice(0, start) + `{${word}}` + draft.naming.slice(end),
    });
    requestAnimationFrame(() => {
      namingRef.current?.focus();
      namingRef.current?.setSelectionRange(
        start + word.length + 2,
        start + word.length + 2,
      );
    });
  };
  const report = (message: string) => {
    setError(message);
    requestAnimationFrame(() =>
      mainRef.current
        ?.querySelector('[role="alert"]')
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  };
  const submit = (confirmed = false) => {
    if (submitting.current) return;
    setError("");
    if (scheduled && !draft.scheduledAt) return report("请选择定时创建时间");
    if (mode === "full_domain") {
      const issue = validateWorkbench(config);
      if (issue) return report(issue);
    }
    if (
      mode === "multi" &&
      config.videoCount !== "全部视频" &&
      (!Number.isSafeInteger(config.count) || config.count < 1 || config.count > (deriving && derivation.allocation === "per_account" ? derivation.count : videos?.length || 1))
    )
      return report("每个计划分配数须为正整数，且不能超过每个账户可用的视频数量");
    const next: AdDraft = {
      ...draft,
      platform: "巨量千川",
      method:
        mode === "push"
          ? "push"
          : mode === "full_domain"
            ? "full_domain"
            : "plan",
      goal,
      creative: mode === "multi" ? "多创意" : "单创意",
      scheduledAt: scheduled ? draft.scheduledAt : "",
      workbench: config,
      derivation: deriving ? derivation : undefined,
    };
    try {
      if (deriving) {
        if (!getAdActor().permissions.includes("uc_derivation")) return report("暂无衍生视频权限");
        const amount = derivationCount(derivation, new Set(next.rows.map(row => row.accountId)).size);
        const issue = validateDerivationCount(amount, readAdPushSettings().maxDerive, activeDerivationCount(actor.id) + activeAdDerivationCount(readAdStore().records, actor.id));
        if (issue) return report(issue);
      }
      const records = createAdRecords(next, readAdStore(), getAdActor(), videos || video);
      if (activeCount + records.length > settings.maxPush)
        return report(
          "本次推送超过当前员工同时推送上限，请减少目标或等待任务结束",
        );
      if (
        mode === "full_domain" &&
        config.operation === "append" &&
        !confirmed
      ) {
        setDialog("confirm");
        return;
      }
      submitting.current = true;
      setBusy(true);
      onCreate(records);
    } catch (e) {
      submitting.current = false;
      setBusy(false);
      setDialog(null);
      report(e instanceof Error ? e.message : "提交失败，请重试");
    }
  };
  const saveConfiguration = () => {
    if (!saveName.trim()) return setError("请输入名称");
    if (saveType === "template") {
      const issue = validateWorkbench(config);
      if (issue) return setError(issue);
    }
    if (saveType === "preset") {
      const id = adId();
      setPresets((p) => [
        ...p,
        { id, name: saveName.trim(), config: structuredClone(config) },
      ]);
      setPreset(id);
    } else {
      try {
        saveAdTemplate({
          id: adId(),
          name: saveName.trim(),
          scope: saveScope as AdTemplate["scope"],
          ownerId: actor.id,
          platform: "巨量千川",
          goal,
          naming: config.planName || "{日期(月日)}_{视频名称}",
          suffix: "",
          params: {
            scene: "日常销售",
            newcomer: "店铺新客",
            adType: "通投广告",
            promotion: "托管",
            coupon: config.coupon,
            budget: Number(config.budget) || 300,
            bid: Number(config.roi) || 2,
            optimization: "支付ROI",
            period: "7天",
          },
          workbench: { ...config, operation: "create" },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存失败");
        return;
      }
    }
    setDialog(null);
    setError("");
    setNotice("保存成功");
  };
  const multiplier = isCreate && config.target === "商品乘方";
  const deliveryTable = (
    <div className="ap-table-scroll">
      <table className="ap-table ap-delivery">
        <thead>
          <tr>
            <th>
              广告账户{" "}
              <button className="ap-link" onClick={openAccounts}>
                <Plus size={14} />
                选择账户
              </button>
            </th>
            <th>{multiplier ? "商品/抖音号" : "抖音号"}</th>
            {goal === "推商品" && <th>{multiplier ? "选择预览" : "商品"}</th>}
            {!isCreate && <th>店铺</th>}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {draft.rows.map((row) => {
            const a = accounts.find((a) => a.id === row.accountId),
              c = a && adCatalog(a);
            const douyinSelect = (
              <select
                aria-label="抖音号"
                value={row.douyinId}
                onChange={(e) =>
                  updateRow(row.id, {
                    douyinId: e.target.value,
                    productId: "",
                    storeId: "",
                  })
                }
              >
                <option value="">请选择抖音号</option>
                {c?.douyins.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            );
            const productSelect = (
              <select
                aria-label="商品"
                disabled={!row.douyinId}
                value={row.productId}
                onChange={(e) =>
                  updateRow(row.id, {
                    productId: e.target.value,
                    storeId:
                      c?.products.find((p) => p.id === e.target.value)
                        ?.storeId || "",
                  })
                }
              >
                <option value="">请选择商品</option>
                {c?.products
                  .filter((p) =>
                    c.stores.some(
                      (s) =>
                        s.id === p.storeId &&
                        s.douyinIds.includes(row.douyinId),
                    ),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            );
            return (
              <tr key={row.id}>
                <td>
                  {a?.name || "账户不可用"}
                  <small>{row.accountId}</small>
                </td>
                <td>
                  {multiplier ? (
                    <div className="ap-object-selects">
                      {douyinSelect}
                      {productSelect}
                    </div>
                  ) : (
                    douyinSelect
                  )}
                </td>
                {goal === "推商品" && (
                  <td>
                    {multiplier ? (
                      <>
                        {c?.products.find((p) => p.id === row.productId)
                          ?.name || "--"}
                        <small>
                          {c?.douyins.find((d) => d.id === row.douyinId)
                            ?.name || "--"}
                        </small>
                      </>
                    ) : (
                      productSelect
                    )}
                  </td>
                )}
                {!isCreate && (
                  <td>
                    <select
                      aria-label="店铺"
                      disabled={!row.douyinId}
                      value={row.storeId}
                      onChange={(e) =>
                        updateRow(row.id, {
                          storeId: e.target.value,
                          productId: "",
                        })
                      }
                    >
                      <option value="">请选择店铺</option>
                      {c?.stores
                        .filter((s) => s.douyinIds.includes(row.douyinId))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </td>
                )}
                <td>
                  <div className="ap-inline">
                    <button
                      className="ap-icon"
                      title="新增组合"
                      onClick={() =>
                        change({
                          rows: [...draft.rows, emptyRow(row.accountId)],
                        })
                      }
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      className="ap-icon"
                      title="删除明细"
                      onClick={() =>
                        change({
                          rows: draft.rows.filter((r) => r.id !== row.id),
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!draft.rows.length && <div className="ap-empty">暂无数据</div>}
    </div>
  );
  const allocation = (
    <Row label="视频分配规则">
      <div className="ap-inline">
        {["全部使用", "平均分配"].map((v) => (
          <div
            key={v}
            className={`ap-allocation ${config.distribution === v ? "is-active" : ""}`}
          >
            <button
              onClick={() =>
                set("distribution", v as AdWorkbenchConfig["distribution"])
              }
            >
              {v}
            </button>
            <Help>
              {v === "全部使用"
                ? `视频重复使用（每个${isCreate ? "商品" : "计划"}，都用一遍已选的视频）`
                : `每个视频只用一次（将已选视频，轮流分配给${isCreate ? "计划里的商品" : "计划"}）`}
            </Help>
          </div>
        ))}
      </div>
    </Row>
  );

  return (
    <OverlayPortal
      layer="modal"
      role="dialog"
      aria-modal="true"
      aria-label="添加推送任务"
      className="ad-push-ui ap-workspace"
    >
      <header className="ap-header">
        <button className="ap-icon" title="返回成片详情" onClick={onClose}>
          <ArrowLeft size={19} />
        </button>
        <Send className="ap-brand-mark" size={25} />
        <h1>添加推送任务</h1>
        <button className="ap-close" title="关闭推送任务" onClick={onClose}>
          <X size={25} />
        </button>
      </header>
      <div className="ap-scroll" ref={mainRef}>
        <div className="ap-layout">
          <nav className="ap-platforms">
            <button className="is-active">
              <BarChart3 size={20} />
              巨量千川
            </button>
          </nav>
          <main className={`ap-main ${mode === "push" ? "ap-only-push" : ""}`}>
            <Section title="推送方式">
              <div className="ap-modes">
                {MODES.map((m) => (
                  <button
                    aria-label={m.label}
                    aria-pressed={mode === m.key}
                    key={m.key}
                    disabled={m.key !== "push" && !canPlan}
                    title={
                      m.key !== "push" && !canPlan
                        ? "暂无管理投放计划权限"
                        : m.label
                    }
                    className={mode === m.key ? "is-active" : ""}
                    onClick={() => switchMode(m.key)}
                  >
                    <span>{m.label}</span>
                    <small>{m.description}</small>
                  </button>
                ))}
              </div>
            </Section>
            {mode === "push" && (
              <Section title="推送视频设置">
                <Row label="视频推送至">
                  <span className="ap-chip">广告账户视频库</span>
                </Row>
                <div className="ap-account-pair">
                  <AccountPanel
                    accounts={accounts}
                    selected={draft.rows.map((r) => r.accountId)}
                    onSelect={replaceAccounts}
                  />
                  <div className="ap-selected">
                    <div className="ap-panel-heading">
                      已选账号{" "}
                      {draft.rows.length > 0 && (
                        <span>（{draft.rows.length}）</span>
                      )}
                    </div>
                    <div className="ap-selected-list">
                      {draft.rows.map((r) => (
                        <div className="ap-account" key={r.id}>
                          <span>
                            {accounts.find((a) => a.id === r.accountId)?.name}
                            <small>{r.accountId}</small>
                          </span>
                          <button
                            title="移除账户"
                            className="ap-icon"
                            onClick={() =>
                              change({
                                rows: draft.rows.filter((x) => x.id !== r.id),
                              })
                            }
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {!draft.rows.length && (
                        <div className="ap-empty left">暂未添加账号</div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            )}
            {mode === "full_domain" && (
              <Section title="推广设置">
                <Row label="营销目标">
                  <div className="ap-targets">
                    {AD_TARGETS.map((t, i) => (
                      <button
                        aria-pressed={config.target === t}
                        key={t}
                        className={`ap-target tone-${i} ${config.target === t ? "is-active" : ""}`}
                        onClick={() => selectTarget(t)}
                      >
                        <span>{t}</span>
                        {t.startsWith("直播") ? (
                          <TvMinimalPlay size={34} />
                        ) : (
                          <ShoppingBag size={34} />
                        )}
                        {config.target === t && (
                          <i>
                            <Check size={12} />
                          </i>
                        )}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="计划投放方式">
                  <Choices
                    label="计划投放方式"
                    values={
                      config.target.startsWith("商品")
                        ? [
                            "已有计划添加视频",
                            config.target === "商品全域"
                              ? "批量创建全域计划"
                              : "批量创建乘方计划",
                          ]
                        : ["已有计划添加视频"]
                    }
                    value={
                      config.operation === "append"
                        ? "已有计划添加视频"
                        : config.target === "商品全域"
                          ? "批量创建全域计划"
                          : "批量创建乘方计划"
                    }
                    onChange={(v) => {
                      set(
                        "operation",
                        v === "已有计划添加视频" ? "append" : "create",
                      );
                      change({ rows: [] });
                    }}
                  />
                  <Select
                    label="选择预设模板"
                    value={preset}
                    placeholder="选择预设模板"
                    options={presets
                      .filter(
                        (p) =>
                          p.config.target === config.target &&
                          p.config.operation === config.operation,
                      )
                      .map((p) => ({ value: p.id, label: p.name }))}
                    onChange={(id) => {
                      const p = presets.find((p) => p.id === id);
                      if (p) {
                        setConfig(structuredClone(p.config));
                        setPreset(id);
                      }
                    }}
                  />
                  <button
                    className="ap-button primary"
                    onClick={() => {
                      setSaveType("preset");
                      setSaveName("");
                      setError("");
                      setDialog("save");
                    }}
                  >
                    存为预设模板
                  </button>
                  <button
                    className="ap-button primary"
                    onClick={() => {
                      setConfig({
                        ...defaultWorkbench(),
                        target: config.target,
                        operation: config.operation,
                        grouping:
                          config.target === "商品乘方"
                            ? "每个商品一条计划"
                            : "一个计划一个商品",
                      });
                      change({ rows: [] });
                      setPreset("");
                    }}
                  >
                    重置
                  </button>
                </Row>
                {config.operation === "append" ? (
                  <>
                    <Row label="选择已有计划">
                      <button
                        className="ap-button primary"
                        onClick={() => setDialog("plans")}
                      >
                        选择计划（{draft.rows.length}）
                      </button>
                    </Row>
                    {draft.rows.length > 0 && (
                      <div className="ap-plan-chips">
                        {draft.rows.map((r) => (
                          <span key={r.id}>
                            {accounts.find((a) => a.id === r.accountId) &&
                              adCatalog(
                                accounts.find((a) => a.id === r.accountId)!,
                              ).plans.find((p) => p.id === r.planId)?.name}
                            <button
                              className="ap-icon"
                              title="移除已选计划"
                              onClick={() =>
                                change({
                                  rows: draft.rows.filter((x) => x.id !== r.id),
                                })
                              }
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  deliveryTable
                )}
              </Section>
            )}
            {isCreate && (
              <Section title="投放参数设置">
                <Row label="参数设置">
                  <button
                    className="ap-chip"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        budget: "",
                        roi: "",
                        bidding: "控成本投放",
                        coupon: false,
                        period: "从今天起长期投放",
                        start: "",
                        end: "",
                        commission: false,
                        starMaterial: false,
                        aigc: false,
                      }))
                    }
                  >
                    <Plus size={14} />
                    新建计划参数
                  </button>
                  <button
                    className="ap-soft-button"
                    onClick={() => setDialog("reference")}
                  >
                    <SlidersHorizontal size={15} />
                    引用已有计划参数
                  </button>
                  <button
                    className="ap-soft-button"
                    onClick={() => {
                      setReferenceTemplate("");
                      setDialog("templates");
                    }}
                  >
                    <Layers3 size={15} />
                    引用模板
                  </button>
                </Row>
                <Row label="出价方式">
                  <Choices
                    label="出价方式"
                    values={
                      config.target === "商品乘方"
                        ? ["控成本投放"]
                        : ["控成本投放", "放量投放"]
                    }
                    value={config.bidding}
                    onChange={(v) =>
                      set("bidding", v as AdWorkbenchConfig["bidding"])
                    }
                  />
                </Row>
                <Row label={config.target === "商品乘方" ? "日预算" : "预算"}>
                  <input
                    className="ap-input-medium"
                    aria-label="预算"
                    type="number"
                    step="0.01"
                    value={config.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    placeholder="请输入金额"
                  />
                  <span className="ap-hint">
                    支持范围：{config.bidding === "放量投放" ? "30" : "300"}
                    ~999,999,999.99，最多两位小数
                  </span>
                </Row>
                {config.bidding === "控成本投放" && (
                  <Row
                    label={
                      config.target === "商品乘方"
                        ? "综合营销ROI目标"
                        : "净成交ROI目标"
                    }
                  >
                    <input
                      className="ap-input-medium"
                      aria-label="ROI目标"
                      type="number"
                      step="0.01"
                      value={config.roi}
                      onChange={(e) => set("roi", e.target.value)}
                      placeholder="请输入目标"
                    />
                    <span className="ap-hint">
                      支持范围：0.01~10000，最多两位小数
                    </span>
                  </Row>
                )}
                <Row label="投放日期">
                  <Choices
                    label="投放日期"
                    values={["从今天起长期投放", "设置开始和结束时间"]}
                    value={config.period}
                    onChange={(v) =>
                      set("period", v as AdWorkbenchConfig["period"])
                    }
                  />
                  {config.period !== "从今天起长期投放" && (
                    <div className="ap-inline">
                      <input
                        aria-label="投放开始日期"
                        type="date"
                        value={config.start}
                        onChange={(e) => set("start", e.target.value)}
                      />
                      <span>至</span>
                      <input
                        aria-label="投放结束日期"
                        type="date"
                        min={config.start}
                        value={config.end}
                        onChange={(e) => set("end", e.target.value)}
                      />
                    </div>
                  )}
                </Row>
                <Row label="智能优惠券">
                  <Switch
                    label="智能优惠券"
                    value={config.coupon}
                    onChange={(v) => set("coupon", v)}
                  />
                </Row>
                {config.target === "商品乘方" &&
                  (
                    [
                      ["starMaterial", "千川星选素材投放"],
                      ["commission", "达人带货佣金优化"],
                      ["aigc", "AIGC动态创意"],
                    ] as const
                  ).map(([key, label]) => (
                    <Row key={key} label={label}>
                      <Switch
                        label={label}
                        value={config[key]}
                        onChange={(v) => set(key, v)}
                      />
                    </Row>
                  ))}
              </Section>
            )}
            {mode === "full_domain" && (
              <Section title="创意设置">
                {allocation}
                {config.operation === "append" ? (
                  <>
                    <Row label="移除计划在投视频">
                      <Choices
                        label="移除计划在投视频"
                        values={[
                          "不移除",
                          "移除指定素材ID",
                          "移除低数据视频",
                          "移除卡审视频",
                        ]}
                        value={config.removal}
                        onChange={(v) =>
                          set("removal", v as AdWorkbenchConfig["removal"])
                        }
                      />
                    </Row>
                    {config.removal === "移除指定素材ID" && (
                      <Row label="移除视频素材ID">
                        <textarea
                          aria-label="移除视频素材ID"
                          value={config.removeIds}
                          onChange={(e) => set("removeIds", e.target.value)}
                          placeholder="请输入需要移除的视频素材ID，多个ID可用逗号隔开，或换行"
                        />
                      </Row>
                    )}
                    {config.removal === "移除低数据视频" && (
                      <>
                        <Row label="判断逻辑">
                          <span className="ap-chip outline">
                            以下所有条件满足时执行
                          </span>
                          <label className="ap-inline">
                            <input
                              type="checkbox"
                              checked={config.removeRejected}
                              onChange={(e) =>
                                set("removeRejected", e.target.checked)
                              }
                            />
                            卡审的视频直接移除
                          </label>
                        </Row>
                        <Row label="">
                          <div className="ap-conditions">
                            <div>
                              <em>*</em> 必填条件1：计划内视频{" "}
                              <span className="ap-condition-kind">消耗</span> 近{" "}
                              <input
                                aria-label="消耗统计天数"
                                type="number"
                                value={config.costDays}
                                onChange={(e) =>
                                  set("costDays", e.target.value)
                                }
                              />{" "}
                              天，计划内消耗在{" "}
                              <input
                                aria-label="消耗最小值"
                                type="number"
                                placeholder="最小值"
                                value={config.costMin}
                                onChange={(e) => set("costMin", e.target.value)}
                              />{" "}
                              元 至{" "}
                              <input
                                aria-label="消耗最大值"
                                type="number"
                                placeholder="最大值"
                                value={config.costMax}
                                onChange={(e) => set("costMax", e.target.value)}
                              />{" "}
                              元范围内
                            </div>
                            <div>
                              <em>*</em> 必填条件2：计划内视频{" "}
                              <span className="ap-condition-kind">ROI</span> 近{" "}
                              <input
                                aria-label="ROI统计天数"
                                type="number"
                                value={config.roiDays}
                                onChange={(e) => set("roiDays", e.target.value)}
                              />{" "}
                              天，计划内ROI ≤{" "}
                              <input
                                aria-label="ROI上限"
                                type="number"
                                value={config.roiMax}
                                onChange={(e) => set("roiMax", e.target.value)}
                              />
                            </div>
                            <div>
                              选填条件3：视频上传至千川视频库时间 ≥{" "}
                              <input
                                aria-label="上传天数"
                                type="number"
                                value={config.ageDays}
                                onChange={(e) => set("ageDays", e.target.value)}
                              />{" "}
                              天
                            </div>
                          </div>
                        </Row>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Row label="标题">
                      <div className="ap-title-inputs">
                        <button
                          className="ap-link"
                          disabled={config.titles.length >= 30}
                          onClick={() => set("titles", [...config.titles, ""])}
                        >
                          <Plus size={14} />
                          添加标题
                        </button>
                        <small>
                          已添加：<b>{config.titles.length}</b>/30
                        </small>
                        {config.titles.map((t, i) => (
                          <div className="ap-inline" key={i}>
                            <div className="ap-count-input">
                              <input
                                aria-label={`创意标题${i + 1}`}
                                placeholder="请输入标题"
                                maxLength={55}
                                value={t}
                                onChange={(e) =>
                                  set(
                                    "titles",
                                    config.titles.map((x, j) =>
                                      j === i ? e.target.value : x,
                                    ),
                                  )
                                }
                              />
                              <span>{t.length}/55</span>
                            </div>
                            {config.titles.length > 1 && (
                              <button
                                className="ap-icon"
                                title="删除标题"
                                onClick={() =>
                                  set(
                                    "titles",
                                    config.titles.filter((_, j) => j !== i),
                                  )
                                }
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </Row>
                    {config.target === "商品全域" && (
                      <Row label="推广卡片">
                        <button
                          className={`ap-button ${config.cardTitle ? "" : "danger-text"}`}
                          onClick={() => {
                            setCardDraft({
                              title: config.cardTitle,
                              points: config.cardSellingPoints,
                            });
                            setDialog("card");
                          }}
                        >
                          {config.cardTitle || "未配置推广卡片"}
                        </button>
                      </Row>
                    )}
                    <Row label="抖音主页可见性">
                      <Choices
                        label="抖音主页可见性"
                        values={["仅单次展示可见", "主页始终可见"]}
                        value={config.profile}
                        onChange={(v) =>
                          set("profile", v as AdWorkbenchConfig["profile"])
                        }
                      />
                    </Row>
                  </>
                )}
              </Section>
            )}
            {isCreate && (
              <Section title="计划设置">
                <Row label="计划生成规则">
                  <Choices
                    label="计划生成规则"
                    values={
                      config.target === "商品乘方"
                        ? [
                            "每个商品一条计划",
                            "每个抖音号一条计划",
                            "全量组合（商品+抖音号）",
                            "聚合为一条计划",
                          ]
                        : ["一个计划一个商品", "一个计划多个商品"]
                    }
                    value={config.grouping}
                    onChange={(v) => set("grouping", v)}
                  />
                </Row>
                <Row label="计划名称">
                  <input
                    className="ap-input-wide"
                    aria-label="计划名称"
                    value={config.planName}
                    onChange={(e) => set("planName", e.target.value)}
                    placeholder="请输入计划名称"
                  />
                  <label className="ap-inline ap-purple">
                    <input
                      type="checkbox"
                      checked={config.suffix}
                      onChange={(e) => set("suffix", e.target.checked)}
                    />
                    随机ID后缀
                  </label>
                  <div className="ap-words">
                    动态词包：
                    {[
                      "创建日期",
                      "创建时间",
                      "抖音号名称",
                      "商品名称",
                      "整体支付ROI目标",
                    ].map((w) => (
                      <button
                        key={w}
                        onClick={() =>
                          set("planName", config.planName + `{${w}}`)
                        }
                      >{`{${w}}`}</button>
                    ))}
                  </div>
                </Row>
                <Row label="计划创建后状态">
                  <Switch
                    label="计划创建后状态"
                    value={false}
                    onChange={() => {}}
                    disabled
                  />
                  <span className="ap-hint">已暂停</span>
                </Row>
              </Section>
            )}
            {isPlanMode && (
              <Section>
                <div className="ap-template-pair">
                  <div className="ap-template-panel">
                    <div className="ap-panel-heading ap-tabs">
                      {["收藏模板", "个人模板", "公司模板"].map((s) => (
                        <button
                          className={templateScope === s ? "is-active" : ""}
                          key={s}
                          onClick={() => setTemplateScope(s)}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        className="ap-link ap-ml-auto"
                        onClick={() => setEditor({})}
                      >
                        新建模板
                      </button>
                    </div>
                    <div className="ap-account-search">
                      <input
                        aria-label="搜索模板"
                        placeholder="请输入模板名称"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                      />
                    </div>
                    <div className="ap-template-tools">
                      <label className="ap-inline">
                        <input
                          type="checkbox"
                          aria-label="全选模板"
                          checked={
                            visibleTemplates.length > 0 &&
                            visibleTemplates.every((t) =>
                              draft.templateIds.includes(t.id),
                            )
                          }
                          onChange={(e) =>
                            change({
                              templateIds: e.target.checked
                                ? [
                                    ...new Set([
                                      ...draft.templateIds,
                                      ...visibleTemplates.map((t) => t.id),
                                    ]),
                                  ]
                                : draft.templateIds.filter(
                                    (id) =>
                                      !visibleTemplates.some(
                                        (t) => t.id === id,
                                      ),
                                  ),
                            })
                          }
                        />
                        全选
                      </label>
                      <button className="ap-link" onClick={openAccounts}>
                        替换广告账户
                      </button>
                      <Select
                        label="模板营销目标"
                        value={draft.goal}
                        options={["推商品", "推直播间"]}
                        onChange={(v) =>
                          change({
                            goal: v as AdDraft["goal"],
                            templateIds: [],
                            rows: [],
                          })
                        }
                      />
                    </div>
                    <div className="ap-template-list">
                      {visibleTemplates.map((t) => (
                        <div
                          className={`ap-template-item ${draft.templateIds.includes(t.id) ? "is-active" : ""}`}
                          key={t.id}
                        >
                          <label>
                            <input
                              type="checkbox"
                              aria-label={`选择模板 ${t.name}`}
                              checked={draft.templateIds.includes(t.id)}
                              onChange={() =>
                                change({
                                  templateIds: toggle(draft.templateIds, t.id),
                                })
                              }
                            />
                            <span>
                              {t.name}
                              <small>
                                {t.goal} · 日预算 {t.params.budget} 元
                              </small>
                            </span>
                          </label>
                          <div className="ap-inline">
                            <button
                              className="ap-icon"
                              title="收藏模板"
                              onClick={() => setStarred(toggle(starred, t.id))}
                            >
                              <Star
                                size={15}
                                fill={
                                  starred.includes(t.id)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                            <button
                              className="ap-icon"
                              title={`编辑模板 ${t.name}`}
                              onClick={() => setEditor({ template: t })}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="ap-icon"
                              title={`删除模板 ${t.name}`}
                              onClick={() => setDeleting(t)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {!visibleTemplates.length && (
                        <div className="ap-empty left">暂无数据</div>
                      )}
                    </div>
                  </div>
                  <div className="ap-template-panel">
                    <div className="ap-panel-heading">
                      已选模板/广告账户
                      <span className="ap-ml-auto">
                        预计搭建{" "}
                        <b>{draft.rows.length * selectedTemplates.length}</b>{" "}
                        个计划
                      </span>
                    </div>
                    {selectedTemplates.map((t) => (
                      <div className="ap-picked-template" key={t.id}>
                        <div>
                          {t.name}
                          <button
                            className="ap-icon"
                            title="移除已选模板"
                            onClick={() =>
                              change({
                                templateIds: draft.templateIds.filter(
                                  (id) => id !== t.id,
                                ),
                              })
                            }
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <small>
                          {draft.rows.length
                            ? `${draft.rows.length} 个投放组合`
                            : "暂未添加广告账户"}
                        </small>
                        <button className="ap-link" onClick={openAccounts}>
                          <Plus size={14} />
                          选择账户
                        </button>
                      </div>
                    ))}
                    {!selectedTemplates.length && (
                      <div className="ap-empty">暂无数据</div>
                    )}
                  </div>
                </div>
                {draft.rows.length > 0 && (
                  <div className="ap-template-delivery">{deliveryTable}</div>
                )}
              </Section>
            )}
            <Section title={mode === "push" ? undefined : "推送视频设置"}>
              <Row label="创建时间">
                <Choices
                  radio
                  label="创建时间"
                  values={["立即创建", "定时创建"]}
                  value={scheduled ? "定时创建" : "立即创建"}
                  onChange={(v) => {
                    setScheduled(v === "定时创建");
                    if (v === "立即创建") change({ scheduledAt: "" });
                  }}
                />
                <Help>
                  可选时间为1小时后至30天内；参考流程预计在设定时间后1小时内完成创建。
                </Help>
                {scheduled && (
                  <input
                    aria-label="定时创建时间"
                    type="datetime-local"
                    value={draft.scheduledAt}
                    onChange={(e) => change({ scheduledAt: e.target.value })}
                  />
                )}
              </Row>
              <Row
                label={
                  <span>
                    选择推送的视频{" "}
                    <Help>
                      转码后视频体积更小，画面细节可能发生变化；原片与上传的视频保持一致。
                    </Help>
                  </span>
                }
              >
                <Choices
                  radio
                  label="选择推送的视频"
                  values={["转码后视频", "原片"]}
                  value={draft.version}
                  onChange={(v) => change({ version: v as AdDraft["version"] })}
                />
              </Row>
              {mode === "multi" && (
                <Row label="每个计划分配视频数">
                  <Choices
                    radio
                    label="每个计划分配视频数"
                    values={["全部视频", "每个计划分配n个视频"]}
                    value={config.videoCount}
                    onChange={(v) =>
                      set("videoCount", v as AdWorkbenchConfig["videoCount"])
                    }
                  />
                  {config.videoCount !== "全部视频" && (
                    <input
                      aria-label="每计划视频数"
                      type="number"
                      min={1}
                      max={deriving && derivation.allocation === "per_account" ? derivation.count : videos?.length || 1}
                      value={config.count}
                      onChange={(e) => set("count", Number(e.target.value))}
                    />
                  )}
                </Row>
              )}
              {(mode === "multi" || mode === "full_domain") && (
                <Row label="推送搭建策略">
                  <Choices
                    radio
                    label="推送搭建策略"
                    values={["全部成功才搭建计划", "跳过失败的直接搭建"]}
                    value={config.strategy}
                    onChange={(v) =>
                      set("strategy", v as AdWorkbenchConfig["strategy"])
                    }
                  />
                </Row>
              )}
              <Row label="推送成功后修改视频状态为">
                <Select
                  label="推送成功后视频状态"
                  value={draft.successStatus || ""}
                  options={[
                    { value: "", label: "保持不变" },
                    ...resourceConfig.statuses("finished").map((s) => s.name),
                  ]}
                  placeholder="保持不变"
                  onChange={(v) => change({ successStatus: v })}
                />
              </Row>
              <Row label="视频推送至视频库名称">
                <div className="ap-naming-input">
                  <input
                    ref={namingRef}
                    aria-label="视频推送至视频库名称"
                    placeholder="请输入自定义标题"
                    value={draft.naming}
                    onFocus={() => setNameMenu(true)}
                    onChange={(e) => change({ naming: e.target.value })}
                  />
                  <button
                    title="选择命名格式"
                    className="ap-icon"
                    onClick={() => setNameMenu((v) => !v)}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button
                  className="ap-link"
                  onClick={() => {
                    setFormatName("");
                    setFormatPattern("");
                    setError("");
                    setDialog("naming");
                  }}
                >
                  <Plus size={14} />
                  添加格式
                </button>
                <div className="ap-words">
                  动态词包：
                  {[...VIDEO_NAME_WORDS, ...(deriving || video.derivativeId ? ["衍生编号", "原片/转码/衍生编号"] : [])].map((w) => (
                    <button
                      key={w}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertWord(w)}
                    >{`{${w}}`}</button>
                  ))}
                </div>
              </Row>
              {deriving && <div data-testid="ad-derivation-options" className="space-y-4 py-4">
                <Row label="衍生几个视频">
                  <label className="flex items-center gap-2"><input type="radio" name="derive-allocation" checked={derivation.allocation === "shared"} onChange={() => { setError(""); setDerivation({ count: 1, allocation: "shared" }); }} />只衍生1个视频</label>
                  <label className="flex items-center gap-2"><input type="radio" name="derive-allocation" checked={derivation.allocation === "per_account"} onChange={() => { setError(""); setDerivation({ ...derivation, allocation: "per_account" }); }} />每个广告账户衍生N个</label>
                  <input aria-label="每个广告账户衍生数量" className="w-28 rounded-md border border-slate-200 px-3 py-2" type="number" min={1} max={settings.maxDerive} step={1} disabled={derivation.allocation !== "per_account"} value={Number.isNaN(derivation.count) ? "" : derivation.count} onChange={e => { setError(""); setDerivation({ ...derivation, count: e.target.value === "" ? NaN : Number(e.target.value) }); }} />
                </Row>
                <p className="text-sm leading-6 text-slate-600">已选择 {new Set(draft.rows.map(row => row.accountId)).size} 个广告账户，预计衍生 {Number.isSafeInteger(derivation.count) && derivation.count > 0 ? derivationCount(derivation, new Set(draft.rows.map(row => row.accountId)).size) : "--"} 个新视频，完成后推送至所选账户。本地衍生上限 {settings.maxDerive} 个。</p>
              </div>}
            </Section>
            <footer className="ap-footer">
              {error && (
                <p role="alert" className="ap-error">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="ap-success">
                  {notice}
                </p>
              )}
              <div className="ap-footer-actions">
                {isCreate && (
                  <span className="ap-footer-count">
                    预计搭建 <b>{planCount}</b> 个计划
                  </span>
                )}
                <button className="ap-button" onClick={onClose}>
                  取消
                </button>
                {isCreate && (
                  <button
                    className="ap-button outline"
                    onClick={() => {
                      setSaveName("");
                      setSaveType("template");
                      setDialog("save");
                    }}
                  >
                    保存为计划模板
                  </button>
                )}
                <button
                  className="ap-button primary"
                  disabled={busy}
                  onClick={() => submit()}
                >
                  {isCreate ? "开始计划搭建" : "确定"}
                </button>
                <span className="ap-capacity">
                  您当前还能推送{" "}
                  <b>{Math.max(0, settings.maxPush - activeCount)}</b>{" "}
                  个，目前有 <b>{activeCount}</b> 个正在推送，同时推送上限
                  {settings.maxPush}
                  <button
                    title="刷新推送额度"
                    className="ap-icon"
                    onClick={() => {
                      updateAdStore((s) => s);
                      setNotice("已刷新推送额度");
                    }}
                  >
                    <RefreshCw size={13} />
                  </button>
                </span>
              </div>
            </footer>
          </main>
        </div>
      </div>
      {nameMenu && (
        <AnchoredPopover
          anchorRef={namingRef}
          width={500}
          onClose={() => setNameMenu(false)}
          className="ad-push-ui ap-menu"
        >
          <button
            onClick={() => {
              change({ naming: companyVideoNaming() });
              setNameMenu(false);
            }}
          >
            公司统一配置
          </button>
          {formats.map((f) => (
            <div className="ap-format-item" key={f.id}>
              <button
                onClick={() => {
                  change({ naming: f.pattern });
                  setNameMenu(false);
                }}
              >
                {f.name}：{f.pattern}
              </button>
              <button
                className="ap-link"
                onClick={() => {
                  setDeleteFormat(f.id);
                  setNameMenu(false);
                }}
              >
                删除
              </button>
            </div>
          ))}
        </AnchoredPopover>
      )}
      {(dialog === "plans" || dialog === "reference") && (
        <PlanPicker
          accounts={accounts}
          goal={goal}
          reference={dialog === "reference"}
          initial={dialog === "plans" ? draft.rows : []}
          onClose={() => setDialog(null)}
          onConfirm={(rows) => {
            if (dialog === "reference") {
              const r = rows[0],
                a = accounts.find((a) => a.id === r.accountId),
                p = a && adCatalog(a).plans.find((p) => p.id === r.planId);
              if (p)
                setConfig((c) => ({
                  ...c,
                  ...p.workbench,
                  target: c.target,
                  operation: "create",
                  grouping: c.grouping,
                  budget: String(p.budget || 300),
                  roi: String(p.roiTarget || 2),
                  bidding:
                    config.target === "商品乘方"
                      ? "控成本投放"
                      : p.bidding || "控成本投放",
                }));
              setNotice("已引用计划参数");
            } else change({ rows });
            setDialog(null);
          }}
        />
      )}
      {dialog === "accounts" && (
        <AdDialog
          title="选择账户"
          className="ad-push-ui ap-dialog"
          wide
          onClose={() => setDialog(null)}
          footer={
            <>
              <span className="ap-footer-count">
                已选：<b>{picked.length}</b> 个账户
              </span>
              <button className="ap-button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                className="ap-button primary"
                onClick={() => {
                  replaceAccounts(picked);
                  setDialog(null);
                }}
              >
                确定
              </button>
            </>
          }
        >
          <div className="ap-account-pair">
            <AccountPanel
              accounts={accounts}
              selected={picked}
              onSelect={setPicked}
            />
            <div className="ap-selected">
              <div className="ap-panel-heading">已选账号</div>
              {picked.map((id) => (
                <div className="ap-account" key={id}>
                  <span>
                    {accounts.find((a) => a.id === id)?.name}
                    <small>{id}</small>
                  </span>
                  <button
                    className="ap-icon"
                    title="移除账户"
                    onClick={() => setPicked(picked.filter((x) => x !== id))}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </AdDialog>
      )}
      {dialog === "naming" && (
        <AdDialog
          title="新增"
          className="ad-push-ui ap-dialog"
          onClose={() => setDialog(null)}
          footer={
            <>
              {error && (
                <span role="alert" className="ap-error">
                  {error}
                </span>
              )}
              <button className="ap-button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                className="ap-button primary"
                onClick={() => {
                  if (!formatName.trim() || !formatPattern.trim())
                    return setError("请填写名称和自定义标题");
                  setFormats((f) => [
                    ...f,
                    {
                      id: adId(),
                      name: formatName.trim(),
                      pattern: formatPattern.trim(),
                    },
                  ]);
                  change({ naming: formatPattern.trim() });
                  setDialog(null);
                }}
              >
                确定
              </button>
            </>
          }
        >
          <Row
            label={
              <>
                <em>*</em> 名称
              </>
            }
          >
            <input
              aria-label="格式名称"
              value={formatName}
              onChange={(e) => setFormatName(e.target.value)}
            />
          </Row>
          <Row
            label={
              <>
                <em>*</em> 自定义标题
              </>
            }
          >
            <input
              aria-label="自定义标题"
              value={formatPattern}
              onChange={(e) => setFormatPattern(e.target.value)}
            />
            <div className="ap-words">
              {VIDEO_NAME_WORDS.map((w) => (
                <button
                  key={w}
                  onClick={() => setFormatPattern((p) => p + `{${w}}`)}
                >{`{${w}}`}</button>
              ))}
            </div>
          </Row>
        </AdDialog>
      )}
      {deleteFormat && (
        <AdDialog
          title="删除"
          className="ad-push-ui ap-dialog"
          onClose={() => setDeleteFormat(null)}
          footer={
            <>
              <button
                className="ap-button"
                onClick={() => setDeleteFormat(null)}
              >
                取消
              </button>
              <button
                className="ap-button primary"
                onClick={() => {
                  setFormats((f) => f.filter((x) => x.id !== deleteFormat));
                  setDeleteFormat(null);
                }}
              >
                确定
              </button>
            </>
          }
        >
          <p>请确认是否删除该格式</p>
        </AdDialog>
      )}
      {dialog === "save" && (
        <AdDialog
          title={saveType === "preset" ? "存为预设模板" : "保存为计划模板"}
          className="ad-push-ui ap-dialog"
          onClose={() => setDialog(null)}
          footer={
            <>
              {error && (
                <span className="ap-error" role="alert">
                  {error}
                </span>
              )}
              <button className="ap-button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button className="ap-button primary" onClick={saveConfiguration}>
                确定
              </button>
            </>
          }
        >
          <Row label="名称">
            <input
              aria-label="保存名称"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
          </Row>
          {saveType === "template" && (
            <Row label="保存范围">
              <Choices
                label="保存范围"
                values={["个人模板", "公司模板"]}
                value={saveScope}
                onChange={setSaveScope}
              />
            </Row>
          )}
        </AdDialog>
      )}
      {dialog === "card" && (
        <AdDialog
          title="推广卡片"
          className="ad-push-ui ap-dialog"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className="ap-button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                className="ap-button primary"
                onClick={() => {
                  setConfig((c) => ({
                    ...c,
                    cardTitle: cardDraft.title.trim(),
                    cardSellingPoints: cardDraft.points.trim(),
                  }));
                  setDialog(null);
                }}
              >
                确定
              </button>
            </>
          }
        >
          <Row label="卡片标题">
            <input
              aria-label="卡片标题"
              maxLength={55}
              value={cardDraft.title}
              onChange={(e) =>
                setCardDraft((c) => ({ ...c, title: e.target.value }))
              }
            />
          </Row>
          <Row label="商品卖点">
            <textarea
              aria-label="商品卖点"
              value={cardDraft.points}
              onChange={(e) =>
                setCardDraft((c) => ({ ...c, points: e.target.value }))
              }
            />
          </Row>
        </AdDialog>
      )}
      {dialog === "templates" && (
        <AdDialog
          title="选择计划模板"
          wide
          className="ad-push-ui ap-dialog"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className="ap-button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                className="ap-button primary"
                disabled={!templates.some((t) => t.id === referenceTemplate)}
                onClick={() => {
                  const t = templates.find((t) => t.id === referenceTemplate);
                  if (!t) return;
                  setConfig((c) => ({
                    ...c,
                    ...t.workbench,
                    target: c.target,
                    operation: "create",
                    grouping: c.grouping,
                    bidding:
                      c.target === "商品乘方"
                        ? "控成本投放"
                        : t.workbench?.bidding || "控成本投放",
                    budget: String(t.params.budget),
                    roi: String(t.params.bid),
                    coupon: t.params.coupon,
                    planName: t.naming,
                  }));
                  setDialog(null);
                  setNotice("已引用模板参数");
                }}
              >
                确定
              </button>
            </>
          }
        >
          <div className="ap-template-pair">
            <div className="ap-template-panel">
              <div className="ap-panel-heading">已保存模板</div>
              <div className="ap-reference-templates">
                {templates.map((t) => (
                  <label key={t.id} className="ap-reference-template">
                    <input
                      type="radio"
                      name="reference-template"
                      aria-label={t.name}
                      checked={referenceTemplate === t.id}
                      onChange={() => setReferenceTemplate(t.id)}
                    />
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.scope}</small>
                    </span>
                  </label>
                ))}
                {!templates.length && <div className="ap-empty">暂无数据</div>}
              </div>
            </div>
            <div className="ap-template-panel">
              <div className="ap-panel-heading">已选模板规则</div>
              {templates
                .filter((t) => t.id === referenceTemplate)
                .map((t) => (
                  <div className="ap-template-summary" key={t.id}>
                    <strong>{t.name}</strong>
                    <dl>
                      <dt>营销目标</dt>
                      <dd>{t.goal}</dd>
                      <dt>日预算</dt>
                      <dd>{t.params.budget} 元</dd>
                      <dt>ROI / 出价</dt>
                      <dd>{t.params.bid}</dd>
                      <dt>计划名称</dt>
                      <dd>{t.naming}</dd>
                    </dl>
                  </div>
                ))}
              {!referenceTemplate && <div className="ap-empty">暂无数据</div>}
            </div>
          </div>
        </AdDialog>
      )}
      {editor && (
        <TemplateEditor
          initial={editor.template}
          goal={goal}
          video={video}
          onClose={() => setEditor(null)}
          onSave={(t) => {
            change({ templateIds: [...new Set([...draft.templateIds, t.id])] });
            setTemplateScope(t.scope);
            setEditor(null);
          }}
        />
      )}
      {deleting && (
        <AdDialog
          title="删除模板"
          className="ad-push-ui ap-dialog"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button className="ap-button" onClick={() => setDeleting(null)}>
                取消
              </button>
              <button
                className="ap-button primary"
                onClick={() => {
                  updateAdStore((s) => ({
                    ...s,
                    templates: s.templates.filter((t) => t.id !== deleting.id),
                  }));
                  change({
                    templateIds: draft.templateIds.filter(
                      (id) => id !== deleting.id,
                    ),
                  });
                  setDeleting(null);
                }}
              >
                确定删除
              </button>
            </>
          }
        >
          <p>确定删除“{deleting.name}”？已创建任务保留当时配置。</p>
        </AdDialog>
      )}
      {dialog === "confirm" && (
        <AdDialog
          title="确认计划视频操作"
          className="ad-push-ui ap-dialog"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className="ap-button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                className="ap-button primary"
                onClick={() => submit(true)}
              >
                确认提交
              </button>
            </>
          }
        >
          <p>
            将向 {draft.rows.length} 个计划添加当前视频。
            {config.removal !== "不移除"
              ? `同时执行“${config.removal}”，仅从所选计划移除匹配素材，不删除资源库文件。`
              : "保留计划原有视频。"}
          </p>
          <p className="ap-confirm-warning">
            已在投计划中的新增视频可能进入投放，不改变计划当前开启状态。
          </p>
        </AdDialog>
      )}
    </OverlayPortal>
  );
}
