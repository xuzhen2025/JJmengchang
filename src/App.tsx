import React, { useState, useEffect } from "react";
import { useAdStore } from "./lib/useAdStore";
import { getAdActor } from "./lib/adPush";
import { derivationOutput } from "./lib/videoDerivation";
import { canUseDerivations } from "./lib/derivationPermissions";
import { DERIVATIVE_ANALYTICS_EVENT } from "./lib/analyticsNavigation";
import Sidebar from "./components/Sidebar";
import RightQueue, { type TaskQueueUploadRequest } from "./components/TaskQueuePanel";
import UploadFinishedVideoModal from "./components/UploadFinishedVideoModal";
import MaterialSelector from "./components/MaterialSelector";
import CreditsDashboard from "./components/CreditsDashboard";
import AssetsView from "./components/AssetsView";
import ResourcesView from "./components/ResourcesView";
import MaterialsView from "./components/MaterialsView";
import FinishedVideosView from "./components/FinishedVideosView";
import AdDeliveryView from "./components/AdDeliveryView";
import OperationRecordsView from "./components/OperationRecordsView";
import { recordLogin } from "./lib/operationHistory";
import SameStyleVideoView from "./components/SameStyleVideoView";
import VideoRemakeView, { type SourceVideo } from "./components/VideoRemakeView";
import type { TaskItem } from "./components/TaskCollaborationView";
import MessageCenterWorkspace from "./components/MessageCenterWorkspace";
import AdminView from "./components/AdminView";
import LoginView, { AppMode, PrototypeAccount } from "./components/LoginView";
import LogoutConfirmDialog from "./components/LogoutConfirmDialog";

import {
  INITIAL_GALLERY,
  INITIAL_ASSETS,
  INITIAL_TASKS,
  INITIAL_TRANSACTIONS,
  INITIAL_MESSAGES,
} from "./data";
import {
  Asset,
  Task,
  CreditTransaction,
  GalleryItem,
  ActiveScreen,
  AppMessage,
  ResourceSearchIntent,
  AiVideoTaskSnapshot,
  EnhanceTaskOutput,
  EnhanceTaskSnapshot,
  WatermarkTaskOutput,
  WatermarkTaskSnapshot,
  QuickCreationTaskSnapshot,
} from "./types";
import {
  AI_VIDEO_MODE_LABELS,
  getAiVideoInputs,
  isAiVideoSceneMode,
  validateAiVideoScene,
} from "./lib/aiVideo";
import {
  buildEnhanceOutputName,
  getEnhanceOutputDimensions,
} from "./lib/videoEnhance";
import { Sparkles, Layers, Sliders, ChevronRight, Play } from "lucide-react";

import { useScopedTaggedResources } from "./lib/useResourceTags";
import { resourceTagStore } from "./lib/resourceTags";
import { useUploadedResources, resourceScope } from "./lib/resourceUploads";
import { creditLimitsForUser, creditUsage, readCreditQuotaSettings, remainingQuota, subscribeCreditQuotaSettings } from "./lib/creditQuota";

const AUTH_STORAGE_KEY = "mengchang_prototype_session";

const PROTOTYPE_ACCOUNTS: PrototypeAccount[] = [
  {
    username: "chaojiguanliyuan",
    password: "123456",
    label: "超级管理员",
    description: "用户端与管理端",
    allowedModes: ["user", "admin"],
    defaultMode: "user",
  },
  {
    username: "putongyonghu",
    password: "123456",
    label: "普通用户",
    description: "仅用户端",
    allowedModes: ["user"],
    defaultMode: "user",
  },
  {
    username: "guanliyuan",
    password: "123456",
    label: "管理员",
    description: "仅管理端",
    allowedModes: ["admin"],
    defaultMode: "admin",
  },
];

interface PersistedSession {
  username: string;
  mode: AppMode;
}

const readPersistedSession = (): PersistedSession | null => {
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedSession;
    const account = PROTOTYPE_ACCOUNTS.find(
      (item) => item.username === parsed.username,
    );
    if (!account) return null;
    return {
      username: account.username,
      mode: account.allowedModes.includes(parsed.mode)
        ? parsed.mode
        : account.defaultMode,
    };
  } catch {
    return null;
  }
};

export default function App() {
  useAdStore();
  const initialSession = readPersistedSession();
  const [session, setSession] = useState<PersistedSession | null>(
    initialSession,
  );
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  // Navigation & UI States (supports back stack)
  const [screenHistory, setScreenHistory] = useState<ActiveScreen[]>(["video_remake"]);
  const activeScreen = screenHistory[screenHistory.length - 1] || "video_remake";
  const [resourceSearchIntent, setResourceSearchIntent] =
    useState<ResourceSearchIntent | null>(null);
  const [analyticsDerivativeId, setAnalyticsDerivativeId] = useState<string | undefined>();
  useEffect(() => {
    const navigate = (event: Event) => {
      const id = (event as CustomEvent<{ derivativeId: string }>).detail?.derivativeId;
      if (!id || !canUseDerivations(getAdActor()) || !derivationOutput(id)) return;
      setAnalyticsDerivativeId(id);
      setQueueUploadRequest(null);
      setScreenHistory(previous => previous[previous.length - 1] === "ad_delivery" ? previous : [...previous, "ad_delivery"]);
    };
    window.addEventListener(DERIVATIVE_ANALYTICS_EVENT, navigate);
    return () => window.removeEventListener(DERIVATIVE_ANALYTICS_EVENT, navigate);
  }, []);
  const [activeRemakeSessionId, setActiveRemakeSessionId] = useState<
    string | null
  >(null);
  const [remakeSourceRequest, setRemakeSourceRequest] = useState<{
    sessionId: string;
    source: SourceVideo;
  } | null>(null);
  const [resourceUploadRequest, setResourceUploadRequest] = useState<{
    type: "图片" | "成片";
    files: Array<{ name: string; type: string; url: string }>;
  } | null>(null);
  const [queueUploadRequest, setQueueUploadRequest] = useState<TaskQueueUploadRequest | null>(null);

  const handleNavigate = (screen: ActiveScreen) => {
    if (screen === "ad_delivery") setAnalyticsDerivativeId(undefined);
    setQueueUploadRequest(null);
    setScreenHistory((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
  };

  const handleBack = () => {
    setQueueUploadRequest(null);
    setScreenHistory((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return ["video_remake"];
    });
  };

  const handleSidebarNavigate = (screen: ActiveScreen) => {
    if (screen === "ad_delivery") setAnalyticsDerivativeId(undefined);
    setQueueUploadRequest(null);
    if (screen === "resources") {
      setResourceSearchIntent(null);
    }
    if (screen === "video_remake") {
      setActiveRemakeSessionId(null);
      setRemakeSourceRequest(null);
    }
    setScreenHistory([screen]);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(
    () => window.innerWidth < 768,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrowViewport(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Mode switching state (用户端 vs 管理端)
  const [appMode, setAppMode] = useState<AppMode>(
    initialSession?.mode ?? "user",
  );
  const [adminActiveScreen, setAdminActiveScreen] =
    useState<string>("content_management");

  const currentAccount = session
    ? (PROTOTYPE_ACCOUNTS.find(
        (account) => account.username === session.username,
      ) ?? null)
    : null;

  const handleLogin = (account: PrototypeAccount) => {
    recordLogin(account.username, true);
    const nextSession = {
      username: account.username,
      mode: account.defaultMode,
    };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setAppMode(account.defaultMode);
    setScreenHistory(["video_remake"]);
    setAdminActiveScreen("content_management");
  };

  const handleModeChange = (mode: AppMode) => {
    if (!currentAccount?.allowedModes.includes(mode)) return;
    setQueueUploadRequest(null);
    const nextSession = { username: currentAccount.username, mode };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setAppMode(mode);
    setIsQueueOpen(false);
  };

  const handleConfirmLogout = () => {
    setQueueUploadRequest(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setLogoutDialogOpen(false);
    setSession(null);
    setAppMode("user");
    setScreenHistory(["video_remake"]);
    setAdminActiveScreen("content_management");
    setIsQueueOpen(false);
  };

  // App core states
  const [credits, setCredits] = useState(10099.0);
  const [extraRequestedCredits, setExtraRequestedCredits] = useState(10349.0);
  const [transactions, setTransactions] =
    useState<CreditTransaction[]>(INITIAL_TRANSACTIONS);
  const [creditQuotaSettings, setCreditQuotaSettings] = useState(readCreditQuotaSettings);
  useEffect(() => subscribeCreditQuotaSettings(() => setCreditQuotaSettings(readCreditQuotaSettings())), []);
  const [baseAssets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const uploadedResources = useUploadedResources();
  const assets = useScopedTaggedResources<Asset>([...uploadedResources, ...baseAssets.filter((asset) => !uploadedResources.some((upload) => upload.url === asset.url && upload.name === asset.name))], resourceScope);
  useEffect(() => { resourceTagStore.setOwner(session?.username || "chaojiguanliyuan"); }, [session?.username]);
  const [galleryItems, setGalleryItems] =
    useState<GalleryItem[]>(INITIAL_GALLERY);
  const [tasks, setTasks] = useState<Task[]>(() => INITIAL_TASKS);
  const [messages, setMessages] = useState<AppMessage[]>(INITIAL_MESSAGES);
  const walletCredits = credits + extraRequestedCredits;
  const { dailyLimit, monthlyLimit } = creditLimitsForUser(creditQuotaSettings, "徐振");
  const { dailyUsed, monthlyUsed } = creditUsage(transactions);
  const dailyRemaining = remainingQuota(dailyLimit, dailyUsed);
  const monthlyRemaining = remainingQuota(monthlyLimit, monthlyUsed);
  const availableCredits = Math.max(0, Math.min(walletCredits, dailyRemaining, monthlyRemaining));

  const deductAvailableCredits = (amount: number) => {
    if (amount <= 0) return true;
    if (availableCredits < amount) return false;

    const monthlyDeduction = Math.min(credits, amount);
    const extraDeduction = amount - monthlyDeduction;
    setCredits((current) => Math.max(0, current - monthlyDeduction));
    if (extraDeduction > 0) {
      setExtraRequestedCredits((current) =>
        Math.max(0, current - extraDeduction),
      );
    }
    return true;
  };

  // Credit Application Workflow (Closed-Loop)
  const handleRequestCredits = (amount: number, reason: string) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newMsg: AppMessage = {
      id: `msg_credits_app_${Date.now()}`,
      category: "审批待办",
      subcategory: "积分申请",
      type: "积分申请",
      title: `额外积分申请: ${amount} 积分`,
      detail: `申请人: 算法推荐部 - 汤小真 申请积分: ${amount} 积分 申请说明: ${reason} 审批状态: 待审核`,
      summary: `申请人: 算法推荐部 - 汤小真 申请积分: ${amount} 积分 申请说明: ${reason}`,
      status: "unread",
      time: timeStr,
      isRedDot: true,
      eventCode: "CREDIT_APPLICATION_SUBMITTED",
      template: "approval",
      severity: "warning",
      actorName: "汤小真（申请人）",
      recipientNames: ["李部长（审批人）"],
      sourceType: "积分申请单",
      sourceId: `CA-${Date.now()}`,
      businessStatus: "待审批",
      approvalType: "credits",
      approvalStatus: "pending",
      creditsAmount: amount,
      applicantName: "算法推荐部 - 汤小真",
      managerName: "技术研发部 - 李部长",
      details: [
        { label: "申请人", value: "算法推荐部 - 汤小真" },
        { label: "申请部门", value: "算法推荐部" },
        { label: "申请积分", value: `${amount} 积分` },
        { label: "申请说明", value: reason },
        { label: "审核部长", value: "技术研发部 - 李部长" },
        { label: "审批状态", value: "待审核" },
      ],
    };

    setMessages((prev) => [newMsg, ...prev]);
  };

  const handleApproveCredits = (msgId: string) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg) return;

    const amount = targetMsg.creditsAmount || 0;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    // 1. Update target audit message status
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            approvalStatus: "approved",
            details: (m.details || []).map((d) =>
              d.label === "审批状态"
                ? { label: "审批状态", value: "已审核通过" }
                : d,
            ),
          };
        }
        return m;
      }),
    );

    // 2. Add credits to user
    setExtraRequestedCredits((prev) => prev + amount);

    // 3. Record transaction
    const newTx: CreditTransaction = {
      id: `tx_app_${Date.now()}`,
      type: "recharge",
      amount: amount,
      date: timeStr.slice(0, 10),
      time: timeStr.slice(11, 19),
      note: `额外积分申请审核通过 (+${amount} 积分)`,
      balance: credits + amount,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 4. Create result notification for applicant
    const resultMsg: AppMessage = {
      id: `msg_credits_res_${Date.now()}`,
      category: "审批待办",
      subcategory: "积分申请",
      type: "积分申请",
      title: `积分申请审核结果: 通过`,
      detail: `您申请的 ${amount} 额外积分已由李部长审核通过！积分已自动存入您的账户。`,
      summary: `审核通过！+${amount} 积分已自动到账。`,
      status: "unread",
      time: timeStr,
      isRedDot: true,
      eventCode: "CREDIT_APPLICATION_APPROVED",
      template: "approval",
      severity: "success",
      actorName: "李部长（审批人）",
      recipientNames: ["汤小真（申请人）"],
      sourceType: "积分申请单",
      sourceId: targetMsg.sourceId,
      businessStatus: "已通过",
      approvalStatus: "approved",
      creditsAmount: amount,
      details: [
        { label: "申请结果", value: "审核通过" },
        { label: "发放积分", value: `+${amount} 积分` },
        { label: "审核部长", value: "技术研发部 - 李部长" },
        { label: "备注说明", value: "审核通过，已自动充值到当月剩余积分" },
      ],
    };

    setMessages((prev) => [resultMsg, ...prev]);
  };

  const handleRejectCredits = (msgId: string, rejectReason: string) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg) return;

    const amount = targetMsg.creditsAmount || 0;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    // 1. Update target audit message status
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            approvalStatus: "rejected",
            rejectReason,
            details: (m.details || []).map((d) =>
              d.label === "审批状态"
                ? { label: "审批状态", value: `已驳回 (原因: ${rejectReason})` }
                : d,
            ),
          };
        }
        return m;
      }),
    );

    // 2. Create result notification for applicant
    const resultMsg: AppMessage = {
      id: `msg_credits_res_${Date.now()}`,
      category: "审批待办",
      subcategory: "积分申请",
      type: "积分申请",
      title: `积分申请审核结果: 拒绝`,
      detail: `您申请的 ${amount} 额外积分未通过审核。拒绝原因：${rejectReason}`,
      summary: `审核驳回！原因: ${rejectReason}`,
      status: "unread",
      time: timeStr,
      isRedDot: true,
      eventCode: "CREDIT_APPLICATION_REJECTED",
      template: "approval",
      severity: "warning",
      actorName: "李部长（审批人）",
      recipientNames: ["汤小真（申请人）"],
      sourceType: "积分申请单",
      sourceId: targetMsg.sourceId,
      businessStatus: "已拒绝",
      approvalStatus: "rejected",
      rejectReason,
      creditsAmount: amount,
      details: [
        { label: "申请结果", value: "审核拒绝" },
        { label: "申请积分", value: `${amount} 积分` },
        { label: "审核部长", value: "技术研发部 - 李部长" },
        { label: "拒绝原因", value: rejectReason },
      ],
    };

    setMessages((prev) => [resultMsg, ...prev]);
  };

  const handleMarkMessageRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "read", isRedDot: false } : m,
      ),
    );
  };

  const handleMarkAllMessagesRead = () => {
    setMessages((prev) =>
      prev.map((m) => ({ ...m, status: "read", isRedDot: false })),
    );
  };

  // Material Selector Modal config
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorCallback, setSelectorCallback] = useState<
    ((selectedUrls: string[]) => void) | null
  >(null);
  const [selectorMaxSelections, setSelectorMaxSelections] = useState(5);
  const [selectorAllowedTypes, setSelectorAllowedTypes] = useState<
    Array<"image" | "video" | "audio" | "document" | "template">
  >(["image", "video"]);

  // Preset states for 一键同款
  const [presetPrompt, setPresetPrompt] = useState<string>("");
  const [presetReferences, setPresetReferences] = useState<string[]>([]);
  const [selectedSameStyleItem, setSelectedSameStyleItem] =
    useState<GalleryItem | null>(null);

  // Background ticker simulating GPU cloud rendering
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) => {
        let updated = false;
        const next = prevTasks.map((t) => {
          if (t.autoProgress === false) return t;
          if (t.status === "queue") {
            updated = true;
            return { ...t, status: "generating", progress: 10 };
          }
          if (t.status === "generating") {
            updated = true;
            const nextProgress =
              t.progress + Math.floor(Math.random() * 20 + 10);
            if (nextProgress >= 100) {
              // Complete task!
              triggerTaskCompletedEffects(t);
              return { ...t, status: "completed", progress: 100 };
            }
            return { ...t, progress: nextProgress };
          }
          return t;
        });
        return updated ? (next as Task[]) : prevTasks;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [tasks]);

  // AI video raw-material tasks use a deterministic five-second prototype lifecycle.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTasks((current) => {
        let changed = false;
        const next = current.map((task) => {
          if (
            task.category !== "ai_video" ||
            task.autoProgress !== false ||
            !task.simulationStartedAt ||
            !["queue", "generating"].includes(task.status)
          ) {
            return task;
          }

          const elapsed = now - task.simulationStartedAt;
          if (elapsed < 1200) {
            return task;
          }

          if (elapsed < 5000) {
            const nextProgress = Math.min(
              96,
              Math.max(8, Math.round(((elapsed - 1200) / 3800) * 100)),
            );
            if (task.status !== "generating" || task.progress !== nextProgress)
              changed = true;
            return {
              ...task,
              status: "generating" as const,
              progress: nextProgress,
            };
          }

          const snapshot = task.aiVideoSnapshot;
          const previewMedia =
            snapshot?.selectedLook ||
            snapshot?.character ||
            snapshot?.firstFrame ||
            snapshot?.references?.[0] ||
            snapshot?.sourceVideos?.[0] ||
            snapshot?.modelMedia ||
            snapshot?.clothingImages?.[0] ||
            snapshot?.productImage ||
            snapshot?.solutionMaterial ||
            snapshot?.painMaterial ||
            snapshot?.usageVideo;
          const videoUrl =
            "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4";
          const outputSources =
            snapshot?.mode === "background" && snapshot.sourceVideos?.length
              ? snapshot.sourceVideos
              : [previewMedia];
          const aiVideoOutputs = outputSources.map((media, index) => {
            const duration =
              snapshot?.mode === "background"
                ? Math.min(media?.durationSeconds || snapshot.duration || 8, 8)
                : snapshot?.duration || 8;
            const sourceName = media?.name?.replace(/\.[^.]+$/, "");
            return {
              id: `${task.id}-output-${index + 1}`,
              name:
                snapshot?.mode === "background" && sourceName
                  ? `${sourceName}_换背景.mp4`
                  : `${task.name}.mp4`,
              videoUrl,
              coverUrl:
                media?.coverUrl ||
                (media?.type === "image" ? media.url : "") ||
                "./assets/prototype/luxury-skincare-set.jpg",
              duration,
              size: `${(duration * 1.02 + 0.8 + index * 0.33).toFixed(2)}MB`,
              sourceVideoId:
                snapshot?.mode === "background" ? media?.id : undefined,
            };
          });
          changed = true;
          return {
            ...task,
            status: "completed" as const,
            progress: 100,
            outputFiles: aiVideoOutputs.map((output) => output.videoUrl),
            aiVideoOutput: aiVideoOutputs[0],
            aiVideoOutputs,
          };
        });
        return changed ? next : current;
      });
    }, 160);

    return () => window.clearInterval(interval);
  }, []);

  // Quick creation tasks use the same short prototype lifecycle without auto-publishing results.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTasks((current) => {
        let changed = false;
        const next = current.map((task) => {
          if (
            task.category !== "quick_creation" ||
            !task.quickCreationSnapshot ||
            !task.simulationStartedAt ||
            !["queue", "generating"].includes(task.status)
          )
            return task;
          const elapsed = now - task.simulationStartedAt;
          if (elapsed < 1100) return task;
          if (elapsed < 5000) {
            const progress = Math.min(
              96,
              Math.max(8, Math.round(((elapsed - 1100) / 3900) * 100)),
            );
            if (task.status !== "generating" || task.progress !== progress)
              changed = true;
            return { ...task, status: "generating" as const, progress };
          }
          const snapshot = task.quickCreationSnapshot;
          const imageOutputs = [
            "./assets/prototype/luxury-skincare-set.jpg",
            "./assets/prototype/skincare-product.jpg",
            "./assets/prototype/luxury-skincare-set.jpg",
            "./assets/prototype/skincare-product.jpg",
          ];
          const outputFiles =
            snapshot.mode === "image"
              ? imageOutputs.slice(
                  0,
                  snapshot.outputLabels?.length || snapshot.imageCount,
                )
              : [
                  "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4",
                ];
          changed = true;
          return {
            ...task,
            status: "completed" as const,
            progress: 100,
            outputFiles,
          };
        });
        return changed ? next : current;
      });
    }, 160);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const refundable = tasks.filter(
      (task) =>
        ["watermark", "subtitle", "enhance", "ai_video"].includes(task.category || "") &&
        task.status === "failed" &&
        (task.refundedCredits || 0) < task.creditsCost,
    );
    if (refundable.length === 0) return;

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const totalRefund = refundable.reduce(
      (sum, task) => sum + task.creditsCost - (task.refundedCredits || 0),
      0,
    );
    setCredits((current) => current + totalRefund);
    setTasks((current) =>
      current.map((task) =>
        refundable.some((item) => item.id === task.id)
          ? { ...task, refundedCredits: task.creditsCost }
          : task,
      ),
    );
    setTransactions((current) => [
      ...refundable.map((task, index): CreditTransaction => ({
        id: `tx_video_process_failure_refund_${Date.now()}_${index}`,
        type: "refund",
        tool:
          task.category === "subtitle"
            ? "字幕擦除"
            : task.category === "ai_video"
              ? "AI视频原料"
            : task.category === "enhance"
              ? "画质增强"
              : "视频去水印",
        amount: task.creditsCost - (task.refundedCredits || 0),
        time: timestamp,
        remark: `处理失败，退回全部积分：${task.name}`,
      })),
      ...current,
    ]);
  }, [tasks]);

  // Watermark and subtitle erasing share a deterministic six-second prototype lifecycle.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTasks((current) => {
        let changed = false;
        const next = current.map((task) => {
          if (
            !["watermark", "subtitle"].includes(task.category || "") ||
            task.autoProgress !== false ||
            !task.simulationStartedAt ||
            !["queue", "generating"].includes(task.status)
          ) {
            return task;
          }

          const elapsed = now - task.simulationStartedAt;
          if (elapsed < 1200) return task;
          if (elapsed < 6000) {
            const nextProgress = Math.min(
              96,
              Math.max(6, Math.round(((elapsed - 1200) / 4800) * 100)),
            );
            if (task.status !== "generating" || task.progress !== nextProgress)
              changed = true;
            return {
              ...task,
              status: "generating" as const,
              progress: nextProgress,
            };
          }

          const isSubtitle = task.category === "subtitle";
          const sourceVideo = isSubtitle
            ? task.subtitleSnapshot?.sourceVideo
            : task.watermarkSnapshot?.sourceVideo;
          if (!sourceVideo) return task;
          const output: WatermarkTaskOutput = {
            name: `${sourceVideo.name.replace(/\.[^.]+$/, "")}_${isSubtitle ? "字幕擦除" : "去水印"}.mp4`,
            videoUrl: sourceVideo.url,
            coverUrl: sourceVideo.coverUrl,
            size: sourceVideo.size,
            duration: sourceVideo.duration,
            resolution: sourceVideo.resolution,
          };
          changed = true;
          return {
            ...task,
            status: "completed" as const,
            progress: 100,
            outputFiles: [output.videoUrl],
            ...(isSubtitle
              ? { subtitleOutput: output }
              : { watermarkOutput: output }),
          };
        });
        return changed ? next : current;
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  // Quality enhancement uses an eight-second prototype lifecycle.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTasks((current) => {
        let changed = false;
        const next = current.map((task) => {
          if (
            task.category !== "enhance" ||
            task.autoProgress !== false ||
            !task.simulationStartedAt ||
            !["queue", "generating"].includes(task.status)
          ) {
            return task;
          }

          const elapsed = now - task.simulationStartedAt;
          if (elapsed < 1200) return task;
          if (elapsed < 8000) {
            const nextProgress = Math.min(
              96,
              Math.max(5, Math.round(((elapsed - 1200) / 6800) * 100)),
            );
            if (task.status !== "generating" || task.progress !== nextProgress)
              changed = true;
            return {
              ...task,
              status: "generating" as const,
              progress: nextProgress,
            };
          }

          const snapshot = task.enhanceSnapshot;
          if (!snapshot) return task;
          const output: EnhanceTaskOutput = {
            name: buildEnhanceOutputName(
              snapshot.sourceVideo.name,
              snapshot.outputResolution,
              snapshot.outputFps,
            ),
            videoUrl: snapshot.sourceVideo.url,
            coverUrl: snapshot.sourceVideo.coverUrl,
            size: snapshot.sourceVideo.size,
            duration: snapshot.sourceVideo.duration,
            resolution: getEnhanceOutputDimensions(snapshot.outputResolution),
            fps: snapshot.outputFps,
          };
          changed = true;
          return {
            ...task,
            status: "completed" as const,
            progress: 100,
            outputFiles: [output.videoUrl],
            enhanceOutput: output,
          };
        });
        return changed ? next : current;
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  const triggerTaskCompletedEffects = (task: Task) => {
    // Generate beautiful assets dynamically upon completion
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);

    if (task.type === "video_gen") {
      const videoUrl =
        "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-wearing-a-silk-dress-posing-41710-large.mp4";
      const coverUrl =
        "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80";

      const newAsset: Asset = {
        id: `gen_asset_${Date.now()}`,
        name: `AI视频生成成果_${timestamp.replace(":", "_")}.mp4`,
        type: "video",
        url: videoUrl,
        size: "14.2 MB",
        createdAt: timestamp,
        category: "AI商品成片",
        resourceCategory: "成片",
        source: "ai_generation",
        creator: "徐振",
        publicTags: ["AI生成", "商品成片"],
        coverUrl,
      };

      const newGalleryItem: GalleryItem = {
        id: `gen_g_${Date.now()}`,
        title: `生成视频: ${task.name.replace("AI 视频生成: ", "")}`,
        author: "MC电商至尊",
        authorAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
        type: "video",
        url: videoUrl,
        coverUrl,
        likes: 5,
        views: 18,
        category: "视频",
        duration: "15s",
      };

      setAssets((prev) => [newAsset, ...prev]);
      setGalleryItems((prev) => [newGalleryItem, ...prev]);

      setTimeout(() => {
        setTasks((current) =>
          current.map((ct) =>
            ct.id === task.id ? { ...ct, outputFiles: [videoUrl] } : ct,
          ),
        );
      }, 100);
    } else if (task.type === "image_gen") {
      const imageUrl =
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

      const newAsset: Asset = {
        id: `gen_asset_${Date.now()}`,
        name: `AI商业图像绘制_${timestamp.replace(":", "_")}.png`,
        type: "image",
        url: imageUrl,
        size: "2.1 MB",
        createdAt: timestamp,
        category: "AI商品场景图",
        resourceCategory: "图片",
        source: "ai_generation",
        creator: "徐振",
        publicTags: ["AI生成", "商品场景图"],
      };

      const newGalleryItem: GalleryItem = {
        id: `gen_g_${Date.now()}`,
        title: `生成图片: ${task.name.replace("AI 商业绘图: ", "")}`,
        author: "MC电商至尊",
        authorAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
        type: "image",
        url: imageUrl,
        likes: 2,
        views: 10,
        category: "图片",
      };

      setAssets((prev) => [newAsset, ...prev]);
      setGalleryItems((prev) => [newGalleryItem, ...prev]);

      setTimeout(() => {
        setTasks((current) =>
          current.map((ct) =>
            ct.id === task.id ? { ...ct, outputFiles: [imageUrl] } : ct,
          ),
        );
      }, 100);
    }
  };

  // State operations
  const handleAddTask = (
    type: Task["type"],
    name: string,
    inputFiles: string[],
    creditsCost: number,
    source: "agent" | "tool" = "tool",
    quickCreationSnapshot?: QuickCreationTaskSnapshot,
  ) => {
    if (!deductAvailableCredits(creditsCost)) {
      alert("余额不足！请开通 VIP 订阅方案或在可用积分中心兑换卡密添加额度。");
      return;
    }

    // Create task
    const id = "t_" + Date.now();
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newTask: Task = {
      id,
      name,
      type,
      status: "queue",
      progress: 0,
      inputFiles,
      createdAt: timestamp,
      creditsCost,
      source,
      quickCreationSnapshot,
      autoProgress: quickCreationSnapshot ? false : undefined,
      simulationStartedAt: quickCreationSnapshot ? Date.now() : undefined,
      category: quickCreationSnapshot
        ? "quick_creation"
        : source === "agent"
          ? "agent"
          : type === "watermark"
            ? "watermark"
            : type === "subtitle"
              ? "subtitle"
              : type === "enhance"
                ? "enhance"
                : type === "face_swap"
                  ? "face_swap"
                  : type === "fission"
                    ? "fission"
                    : type === "video_gen"
                      ? "ai_video"
                      : "quick_creation",
    };

    setTasks((prev) => [newTask, ...prev]);

    // Add logging ledger record
    const toolLabel =
      type === "watermark"
        ? "水印擦除"
        : type === "subtitle"
          ? "字幕擦除"
          : type === "enhance"
            ? "画质增强"
            : type === "face_swap"
              ? "视频换脸"
              : type === "fission"
                ? "爆款复刻"
                : type === "video_gen"
                  ? quickCreationSnapshot
                    ? "快速创作"
                    : source === "agent"
                      ? "Agent创作"
                      : "AI视频原料"
                  : source === "agent"
                    ? "Agent创作"
                    : "快速创作";

    const newTx: CreditTransaction = {
      id: "tx_" + Date.now(),
      type: "consume",
      tool: toolLabel,
      amount: -creditsCost,
      time: new Date().toISOString().replace("T", " ").slice(0, 19),
      remark: `生成/处理: ${name}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Force open tasks queue to show progress - disabled to keep queue closed by default
    // setIsQueueOpen(true);
    return id;
  };

  const handleCreateAiVideoTask = (
    snapshot: AiVideoTaskSnapshot,
    creditsCost: number,
  ) => {
    if (isAiVideoSceneMode(snapshot.mode)) {
      const error = validateAiVideoScene(snapshot.mode, snapshot);
      if (error) {
        alert(error);
        return null;
      }
    }
    if (!deductAvailableCredits(creditsCost)) {
      alert("余额不足！请前往个人中心申请或补充积分。");
      return null;
    }

    const now = new Date();
    const id = `ai-video-${now.getTime()}`;
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19);
    const inputFiles = getAiVideoInputs(snapshot).map((item) => item.url);
    const task: Task = {
      id,
      name: `AI视频原料_${AI_VIDEO_MODE_LABELS[snapshot.mode]}_${timestamp.slice(0, 10).replace(/-/g, "")}_${timestamp.slice(11, 19).replace(/:/g, "")}`,
      type: "video_gen",
      status: "queue",
      progress: 0,
      inputFiles,
      createdAt: timestamp,
      creditsCost,
      source: "tool",
      category: "ai_video",
      autoProgress: false,
      cancellable: true,
      restartable: false,
      aiVideoSnapshot: snapshot,
      simulationStartedAt: now.getTime(),
    };

    setTasks((current) => [task, ...current]);
    setTransactions((current) => [
      {
        id: `tx_ai_video_${now.getTime()}`,
        type: "consume",
        tool: "AI视频原料",
        amount: -creditsCost,
        time: timestamp,
        remark: `生成视频：${task.name}`,
      },
      ...current,
    ]);
    return id;
  };

  const handleCreateEraseTask = (
    type: "watermark" | "subtitle",
    snapshot: WatermarkTaskSnapshot,
  ) => {
    const creditsCost = 40;
    if (!deductAvailableCredits(creditsCost)) {
      alert(
        `积分不足，无法开始${type === "subtitle" ? "字幕擦除" : "视频去水印"}。`,
      );
      return null;
    }

    const now = new Date();
    const id = `${type}-${now.getTime()}`;
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19);
    const baseName = snapshot.sourceVideo.name.replace(/\.[^.]+$/, "");
    const suffix = type === "subtitle" ? "字幕擦除" : "去水印";
    const task: Task = {
      id,
      name: `${baseName}_${suffix}`,
      type,
      status: "queue",
      progress: 0,
      inputFiles: [snapshot.sourceVideo.url],
      createdAt: timestamp,
      creditsCost,
      source: "tool",
      category: type,
      autoProgress: false,
      cancellable: true,
      restartable: false,
      ...(type === "subtitle"
        ? { subtitleSnapshot: snapshot }
        : { watermarkSnapshot: snapshot }),
      simulationStartedAt: now.getTime(),
    };

    setTasks((current) => [task, ...current]);
    setTransactions((current) => [
      {
        id: `tx_${type}_${now.getTime()}`,
        type: "consume",
        tool: type === "subtitle" ? "字幕擦除" : "视频去水印",
        amount: -creditsCost,
        time: timestamp,
        remark: `${type === "subtitle" ? "字幕擦除" : "视频去水印"}：${snapshot.sourceVideo.name}`,
      },
      ...current,
    ]);
    return id;
  };

  const handleCreateWatermarkTask = (snapshot: WatermarkTaskSnapshot) =>
    handleCreateEraseTask("watermark", snapshot);
  const handleCreateSubtitleTask = (snapshot: WatermarkTaskSnapshot) =>
    handleCreateEraseTask("subtitle", snapshot);

  const handleCreateEnhanceTask = (
    snapshot: EnhanceTaskSnapshot,
    creditsCost: number,
  ) => {
    if (!deductAvailableCredits(creditsCost)) {
      alert("积分不足，无法开始视频画质增强。");
      return null;
    }

    const now = new Date();
    const id = `enhance-${now.getTime()}`;
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19);
    const outputName = buildEnhanceOutputName(
      snapshot.sourceVideo.name,
      snapshot.outputResolution,
      snapshot.outputFps,
    );
    const task: Task = {
      id,
      name: outputName.replace(/\.mp4$/i, ""),
      type: "enhance",
      status: "queue",
      progress: 0,
      inputFiles: [snapshot.sourceVideo.url],
      createdAt: timestamp,
      creditsCost,
      source: "tool",
      category: "enhance",
      autoProgress: false,
      cancellable: true,
      restartable: false,
      enhanceSnapshot: snapshot,
      simulationStartedAt: now.getTime(),
    };

    setTasks((current) => [task, ...current]);
    setTransactions((current) => [
      {
        id: `tx_enhance_${now.getTime()}`,
        type: "consume",
        tool: "画质增强",
        amount: -creditsCost,
        time: timestamp,
        remark: `视频画质增强：${snapshot.sourceVideo.name}`,
      },
      ...current,
    ]);
    return id;
  };

  const handleConsumeAiVideoCredits = (creditsCost: number, remark: string) => {
    if (!deductAvailableCredits(creditsCost)) {
      alert("积分不足，无法执行当前操作。");
      return false;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19);
    setTransactions((current) => [
      {
        id: `tx_ai_video_preview_${now.getTime()}`,
        type: "consume",
        tool: "AI视频原料",
        amount: -creditsCost,
        time: timestamp,
        remark,
      },
      ...current,
    ]);
    return true;
  };

  const handleSyncAgentTask = (nextTask: Task, creditsCharge: number = 0) => {
    if (creditsCharge > 0 && !deductAvailableCredits(creditsCharge)) {
      alert("积分不足，无法执行当前生成操作");
      return;
    }

    setTasks((current) => {
      const exists = current.some((task) => task.id === nextTask.id);
      return exists
        ? current.map((task) =>
            task.id === nextTask.id ? { ...task, ...nextTask } : task,
          )
        : [nextTask, ...current];
    });

    if (creditsCharge > 0) {
      setTransactions((current) => [
        {
          id: `tx_agent_${Date.now()}`,
          type: "consume",
          tool: nextTask.category === "fission" ? "爆款复刻" : "Agent创作",
          amount: -creditsCharge,
          time: new Date().toISOString().replace("T", " ").slice(0, 19),
          remark: `${nextTask.category === "fission" ? "爆款复刻" : "Agent生成"}：${nextTask.name}`,
        },
        ...current,
      ]);
    }
  };

  const handleAddCredits = (amount: number, remark: string) => {
    setCredits((prev) => prev + amount);

    const newTx: CreditTransaction = {
      id: "tx_recharge_" + Date.now(),
      type: "recharge",
      tool: "系统赠送",
      amount,
      time: new Date().toISOString().replace("T", " ").slice(0, 19),
      remark,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  // Asset manipulations
  const handleUploadAsset = (file: {
    name: string;
    type: "image" | "video" | "audio";
    url: string;
    size: string;
  }) => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newAsset: Asset = {
      id: "asset_upload_" + Date.now(),
      name: file.name,
      type: file.type,
      url: file.url,
      size: file.size,
      createdAt: timestamp,
      category:
        file.type === "image"
          ? "商品图片"
          : file.type === "audio"
            ? "音频素材"
            : "视频素材",
      resourceCategory:
        file.type === "image"
          ? "图片"
          : file.type === "audio"
            ? "音频"
            : "素材",
      source: "resource_library",
      creator: "徐振",
      publicTags: ["个人上传"],
    };
    setAssets((prev) => [newAsset, ...prev]);
  };

  const handleUploadAgentVideos = (
    videos: Array<{ name: string; cover: string }>,
  ) => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const uploadedAssets: Asset[] = videos.map((video, index) => ({
      id: `agent_upload_${Date.now()}_${index}`,
      name: video.name,
      type: "video",
      url: video.cover,
      coverUrl: video.cover,
      size: "24.5 MB",
      createdAt: timestamp,
      category: "AI生成成片",
      resourceCategory: "成片",
      source: "resource_library",
      creator: "徐振",
      publicTags: ["AI生成", "电商营销"],
      status: "未审核",
    }));
    setAssets((current) => [...uploadedAssets, ...current]);
  };

  const handleUploadEraseResult = (
    type: "watermark" | "subtitle",
    output: WatermarkTaskOutput,
  ) => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const label = type === "subtitle" ? "字幕擦除" : "视频去水印";
    setAssets((current) => [
      {
        id: `${type}_upload_${Date.now()}`,
        name: output.name,
        type: "video",
        url: output.videoUrl,
        coverUrl: output.coverUrl,
        size: output.size,
        createdAt: timestamp,
        category: label,
        resourceCategory: "成片",
        source: "resource_library",
        creator: "徐振",
        publicTags: [label, "AI处理"],
        status: "待审核",
        fileInfo: {
          size: output.size,
          resolution: output.resolution,
          duration: `${Math.floor(output.duration / 60)
            .toString()
            .padStart(2, "0")}:${Math.floor(output.duration % 60)
            .toString()
            .padStart(2, "0")}`,
          format: "MP4",
        },
      },
      ...current,
    ]);
  };

  const handleUploadWatermarkResult = (output: WatermarkTaskOutput) =>
    handleUploadEraseResult("watermark", output);
  const handleUploadSubtitleResult = (output: WatermarkTaskOutput) =>
    handleUploadEraseResult("subtitle", output);

  const handleUploadEnhanceResult = (output: EnhanceTaskOutput) => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    setAssets((current) => [
      {
        id: `enhance_upload_${Date.now()}`,
        name: output.name,
        type: "video",
        url: output.videoUrl,
        coverUrl: output.coverUrl,
        size: output.size,
        createdAt: timestamp,
        category: "画质增强",
        resourceCategory: "成片",
        source: "resource_library",
        creator: "徐振",
        publicTags: ["画质增强", "AI处理"],
        status: "待审核",
        fileInfo: {
          size: output.size,
          resolution: output.resolution,
          duration: `${Math.floor(output.duration / 60)
            .toString()
            .padStart(2, "0")}:${Math.floor(output.duration % 60)
            .toString()
            .padStart(2, "0")}`,
          format: "MP4",
        },
      },
      ...current,
    ]);
  };

  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  const handleRenameAsset = (id: string, newName: string) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, name: newName } : a)));
  };

  // Material picker trigger helper
  const handleOpenMaterialSelector = (
    callback: (selectedUrls: string[]) => void,
    maxSelections = 5,
    allowedTypes: Array<
      "image" | "video" | "audio" | "document" | "template"
    > = ["image", "video"],
  ) => {
    setSelectorCallback(() => callback);
    setSelectorMaxSelections(maxSelections);
    setSelectorAllowedTypes(allowedTypes);
    setSelectorOpen(true);
  };

  const clearCompletedTasks = () => {
    setTasks(
      tasks.filter((t) => t.status === "queue" || t.status === "generating"),
    );
  };

  const handleCancelGenerationTask = (taskId: string) => {
    const target = tasks.find((task) => task.id === taskId);
    if (!target || !["queue", "generating"].includes(target.status)) return;
    if (target.category === "ai_video" && target.status !== "queue") return;
    if (
      ["watermark", "subtitle", "enhance"].includes(target.category || "") &&
      target.status !== "queue"
    )
      return;

    const cancelledAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    const refund = target.status === "queue" ? target.creditsCost : 0;
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "cancelled",
              cancelledAt,
              refundedCredits: refund,
            }
          : task,
      ),
    );

    if (refund > 0) {
      setCredits((current) => current + refund);
      setTransactions((current) => [
        {
          id: `tx_cancel_refund_${Date.now()}`,
          type: "refund",
          tool:
            target.category === "watermark"
              ? "视频去水印"
              : target.category === "subtitle"
                ? "字幕擦除"
                : target.category === "enhance"
                  ? "画质增强"
                  : "AI任务取消",
          amount: refund,
          time: cancelledAt,
          remark: `排队阶段取消，退回全部积分：${target.name}`,
        },
        ...current,
      ]);
    }
  };

  const handleRestartGenerationTask = (taskId: string) => {
    const target = tasks.find((task) => task.id === taskId);
    if (!target || !["failed", "cancelled"].includes(target.status)) return;
    if (!deductAvailableCredits(target.creditsCost)) {
      alert("积分不足，无法重新生成");
      return;
    }

    const restartedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "queue",
              progress: 0,
              createdAt: restartedAt.slice(0, 16),
              cancelledAt: undefined,
              refundedCredits: undefined,
              failureReason: undefined,
              outputFiles: undefined,
              aiVideoOutput: undefined,
              aiVideoOutputs: undefined,
            }
          : task,
      ),
    );
    setTransactions((current) => [
      {
        id: `tx_restart_${Date.now()}`,
        type: "consume",
        tool: "重新生成",
        amount: -target.creditsCost,
        time: restartedAt,
        remark: `重新提交任务：${target.name}`,
      },
      ...current,
    ]);
  };

  // Rendering screen router
  const renderMainView = () => {
    if (appMode === "admin") {
      return (
        <AdminView
          adminActiveScreen={adminActiveScreen}
          onTriggerTask={handleAddTask}
          onOpenTaskQueue={() => setIsQueueOpen(true)}
          onLogout={() => setLogoutDialogOpen(true)}
        />
      );
    }

    switch (activeScreen) {
      case "assets":
        return <AssetsView />;
      case "credits":
        return (
          <CreditsDashboard
            dailyLimit={dailyLimit}
            monthlyLimit={monthlyLimit}
            dailyUsed={dailyUsed}
            monthlyUsed={monthlyUsed}
            dailyAvailable={availableCredits}
            transactions={transactions}
            assets={assets}
            onLogout={() => setLogoutDialogOpen(true)}
          />
        );

      case "message_center":
        return (
          <MessageCenterWorkspace
            onBack={handleBack}
            setActiveScreen={handleNavigate}
            messages={messages}
            onApproveCredits={handleApproveCredits}
            onRejectCredits={handleRejectCredits}
            onMarkMessageRead={handleMarkMessageRead}
            onMarkAllMessagesRead={handleMarkAllMessagesRead}
            onOpenResource={(resource) => {
              setResourceSearchIntent({
                type: resource.type,
                query: resource.name,
                openDetail: true,
                requestId: Date.now(),
              });
              handleNavigate("resources");
            }}
          />
        );

      case "resources":
      case "materials":
      case "finished_videos":
      case "scripts":
        return (
          <ResourcesView
            uploadedVideos={assets.filter((asset) => asset.id.startsWith("face-published-") && !uploadedResources.some((item) => item.url === asset.url))}
            initialSearch={resourceSearchIntent}
            onClearInitialSearch={() => setResourceSearchIntent(null)}
            initialTab={
              activeScreen === "materials"
                ? "materials"
                : activeScreen === "scripts"
                  ? "scripts"
                  : "finished_videos"
            }
            initialUpload={resourceUploadRequest}
            onClearInitialUpload={() => setResourceUploadRequest(null)}
            onTriggerTask={(type, name, inputFiles, cost) => {
              handleAddTask(type, name, inputFiles, cost);
            }}
            onNavigateToDelivery={() => {
              handleNavigate("ad_delivery");
            }}
          />
        );

      case "ad_delivery":
        return <AdDeliveryView initialDerivativeId={analyticsDerivativeId} />;
      case "operation_records":
        return <OperationRecordsView onOpenResource={(record) => {
          setResourceSearchIntent({
            type: record.type,
            query: record.resourceId || record.name,
            openDetail: true,
            requestId: Date.now(),
          });
          handleNavigate("resources");
        }} />;

      case "same_style_video":
        return (
          <SameStyleVideoView
            selectedItem={selectedSameStyleItem || galleryItems[0]}
            onBack={() => {
              setSelectedSameStyleItem(null);
              handleBack();
            }}
            onAddTask={(type, name, inputFiles, creditsCost) => {
              handleAddTask(type, name, inputFiles, creditsCost);
            }}
            credits={availableCredits}
          />
        );

      case "video_remake":
        return (
          <VideoRemakeView
            key={activeRemakeSessionId || "latest-remake"}
            onBack={() => setActiveRemakeSessionId(null)}
            onOpenQueue={() => setIsQueueOpen(true)}
            credits={availableCredits}
            assets={assets}
            activeSessionId={activeRemakeSessionId}
            initialSource={remakeSourceRequest?.sessionId === activeRemakeSessionId ? remakeSourceRequest.source : undefined}
            activeTask={
              activeRemakeSessionId
                ? tasks.find(
                    (task) =>
                      task.remakeSessionId === activeRemakeSessionId ||
                      task.id === activeRemakeSessionId,
                  )
                : undefined
            }
            onSessionChange={setActiveRemakeSessionId}
            onSyncTask={handleSyncAgentTask}
            onUploadVideos={handleUploadAgentVideos}
          />
        );

      default:
        return <div className="text-slate-100 p-6">Screen Coming soon...</div>;
    }
  };

  if (!session || !currentAccount) {
    return <LoginView accounts={PROTOTYPE_ACCOUNTS} onLogin={handleLogin} />;
  }

  return (
    <div className="w-screen h-screen flex bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={handleSidebarNavigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        credits={availableCredits}
        openCreditsModal={() => handleNavigate("credits")}
        openAdminProfile={() => setAdminActiveScreen("admin_profile")}
        appMode={appMode}
        setAppMode={handleModeChange}
        allowedModes={currentAccount.allowedModes}
        adminActiveScreen={adminActiveScreen}
        setAdminActiveScreen={setAdminActiveScreen}
      />

      {/* 2. Main Workspace screen router */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Keep the current workspace draft mounted while uploading a queue result. */}
        <div className={queueUploadRequest ? "hidden" : "contents"}>
          {renderMainView()}
        </div>
        {queueUploadRequest && <UploadFinishedVideoModal
          isOpen
          isPage
          initialFiles={queueUploadRequest.files}
          onClose={() => { setQueueUploadRequest(null); setIsQueueOpen(true); }}
          onPublishSuccess={queueUploadRequest.onPublishSuccess}
        />}
      </main>

      {/* 3. Right task queue drawer */}
      {appMode !== "admin" && (
        <RightQueue
          tasks={tasks}
          isOpen={isQueueOpen}
          setIsOpen={setIsQueueOpen}
          cancelTask={handleCancelGenerationTask}
          restartTask={handleRestartGenerationTask}
          uploadEraseResult={handleUploadEraseResult}
          uploadEnhanceResult={handleUploadEnhanceResult}
          uploadPageOpen={Boolean(queueUploadRequest)}
          onUploadToLibrary={(request) => {
            setQueueUploadRequest(request);
            setIsQueueOpen(false);
          }}
          viewResult={(taskId) => {
            const task = tasks.find((item) => item.id === taskId);
            if (task?.category === "fission" || task?.type === "fission") {
              setActiveRemakeSessionId(task.remakeSessionId || task.id);
              setScreenHistory(["video_remake"]);
              setIsQueueOpen(false);
              return;
            }
            handleNavigate("resources");
          }}
        />
      )}

      {/* 4. Global Assets selector popup */}
      {selectorOpen && (
        <MaterialSelector
          isOpen={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          assets={assets}
          onUploadAsset={handleUploadAsset}
          onSelectMaterials={(urls) => {
            if (selectorCallback) {
              selectorCallback(urls);
            }
          }}
          maxSelections={selectorMaxSelections}
          allowedTypes={selectorAllowedTypes}
        />
      )}

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
