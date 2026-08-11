/**
 * Curated icon set — SPEC §4.7.
 *
 * Exports are *descriptors*, not components. That is deliberate: a raw Lucide
 * glyph cannot be rendered directly, so stroke width can never drift between
 * two icons in the same toolbar. Everything goes through `<Icon glyph={…} />`.
 *
 * `nudge` is an optical correction in pixels, applied as a sub-pixel translate.
 * Glyphs whose visual mass sits off the geometric centre of their box — a play
 * triangle, a paper plane, a chevron — look misaligned when centred
 * mathematically. Only glyphs that actually need it carry a nudge.
 */

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AtSign,
  Ban,
  Bell,
  Bold,
  Box,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clapperboard,
  Clock,
  Copy,
  CornerDownLeft,
  CreditCard,
  Crop,
  Download,
  Droplet,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  FastForward,
  Film,
  Filter,
  Folder,
  Gauge,
  Grid2x2,
  GripVertical,
  Hand,
  Headphones,
  Heart,
  Image,
  Info,
  Italic,
  Layers,
  LayoutTemplate,
  Link,
  List,
  Lock,
  LogOut,
  Maximize2,
  Megaphone,
  Menu,
  Mic,
  Minimize2,
  Minus,
  MousePointer2,
  Music,
  Package,
  Palette,
  PanelRight,
  Pause,
  Pencil,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  RotateCw,
  Scissors,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingBag,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Table,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Type,
  Undo2,
  Unlock,
  Upload,
  User,
  Users,
  Video,
  Volume2,
  VolumeX,
  Wand,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

export interface IconDef {
  readonly glyph: LucideIcon;
  /** Optical correction in px, `[x, y]`, applied at 16px and scaled with size. */
  readonly nudge?: readonly [number, number];
}

const def = (glyph: LucideIcon, nudge?: readonly [number, number]): IconDef =>
  nudge ? { glyph, nudge } : { glyph };

/* ── Chrome & navigation ─────────────────────────────────────────────────── */
export const IconMenu = /*#__PURE__*/ def(Menu);
export const IconClose = /*#__PURE__*/ def(X);
export const IconPlus = /*#__PURE__*/ def(Plus);
export const IconMinus = /*#__PURE__*/ def(Minus);
export const IconSearch = /*#__PURE__*/ def(Search);
export const IconFilter = /*#__PURE__*/ def(Filter);
export const IconMore = /*#__PURE__*/ def(Ellipsis);
export const IconSettings = /*#__PURE__*/ def(Settings);
export const IconLogOut = /*#__PURE__*/ def(LogOut);
export const IconBell = /*#__PURE__*/ def(Bell);
export const IconUser = /*#__PURE__*/ def(User);
export const IconTeam = /*#__PURE__*/ def(Users);
export const IconBilling = /*#__PURE__*/ def(CreditCard);
export const IconPanelRight = /*#__PURE__*/ def(PanelRight);
export const IconGrip = /*#__PURE__*/ def(GripVertical);

/* Chevrons carry their mass on one side of the box. */
export const IconChevronDown = /*#__PURE__*/ def(ChevronDown, [0, 0.5]);
export const IconChevronUp = /*#__PURE__*/ def(ChevronUp, [0, -0.5]);
export const IconChevronLeft = /*#__PURE__*/ def(ChevronLeft, [-0.5, 0]);
export const IconChevronRight = /*#__PURE__*/ def(ChevronRight, [0.5, 0]);
export const IconChevronsUpDown = /*#__PURE__*/ def(ChevronsUpDown);

export const IconArrowUp = /*#__PURE__*/ def(ArrowUp);
export const IconArrowDown = /*#__PURE__*/ def(ArrowDown);
export const IconArrowLeft = /*#__PURE__*/ def(ArrowLeft);
export const IconArrowRight = /*#__PURE__*/ def(ArrowRight);
export const IconArrowUpRight = /*#__PURE__*/ def(ArrowUpRight);
export const IconExternal = /*#__PURE__*/ def(ExternalLink);
export const IconEnter = /*#__PURE__*/ def(CornerDownLeft);

/* ── Status & feedback ───────────────────────────────────────────────────── */
export const IconCheck = /*#__PURE__*/ def(Check);
export const IconCheckAll = /*#__PURE__*/ def(CheckCheck);
export const IconCheckCircle = /*#__PURE__*/ def(CircleCheck);
export const IconErrorCircle = /*#__PURE__*/ def(CircleX);
export const IconWarning = /*#__PURE__*/ def(CircleAlert);
export const IconInfo = /*#__PURE__*/ def(Info);
export const IconHelp = /*#__PURE__*/ def(CircleHelp);
export const IconBlocked = /*#__PURE__*/ def(Ban);
export const IconClock = /*#__PURE__*/ def(Clock);
export const IconRetry = /*#__PURE__*/ def(RefreshCw);

/* ── Transport ───────────────────────────────────────────────────────────── */
/* A play triangle's visual centre sits left of its geometric centre. */
export const IconPlay = /*#__PURE__*/ def(Play, [0.5, 0]);
export const IconPause = /*#__PURE__*/ def(Pause);
export const IconSkipBack = /*#__PURE__*/ def(SkipBack, [-0.5, 0]);
export const IconSkipForward = /*#__PURE__*/ def(SkipForward, [0.5, 0]);
export const IconFastForward = /*#__PURE__*/ def(FastForward, [0.5, 0]);
export const IconVolume = /*#__PURE__*/ def(Volume2);
export const IconMuted = /*#__PURE__*/ def(VolumeX);
export const IconFullscreen = /*#__PURE__*/ def(Maximize2);
export const IconExitFullscreen = /*#__PURE__*/ def(Minimize2);

/* ── Media types ─────────────────────────────────────────────────────────── */
export const IconVideo = /*#__PURE__*/ def(Video);
export const IconImage = /*#__PURE__*/ def(Image);
export const IconAudio = /*#__PURE__*/ def(Music);
export const IconVoice = /*#__PURE__*/ def(Mic);
export const IconHeadphones = /*#__PURE__*/ def(Headphones);
export const IconFilm = /*#__PURE__*/ def(Film);
export const IconSlideshow = /*#__PURE__*/ def(Clapperboard);
export const IconFolder = /*#__PURE__*/ def(Folder);
export const IconTemplate = /*#__PURE__*/ def(LayoutTemplate);
export const IconPackage = /*#__PURE__*/ def(Package);

/* ── Editing tools ───────────────────────────────────────────────────────── */
export const IconSelect = /*#__PURE__*/ def(MousePointer2, [-0.5, 0]);
export const IconHand = /*#__PURE__*/ def(Hand);
export const IconSplit = /*#__PURE__*/ def(Scissors);
export const IconText = /*#__PURE__*/ def(Type);
export const IconShape = /*#__PURE__*/ def(Square);
export const IconCrop = /*#__PURE__*/ def(Crop);
export const IconZoomIn = /*#__PURE__*/ def(ZoomIn);
export const IconZoomOut = /*#__PURE__*/ def(ZoomOut);
export const IconLayers = /*#__PURE__*/ def(Layers);
export const IconRotate = /*#__PURE__*/ def(RotateCw);
export const IconBold = /*#__PURE__*/ def(Bold);
export const IconItalic = /*#__PURE__*/ def(Italic);
export const IconAlignLeft = /*#__PURE__*/ def(AlignLeft);
export const IconAlignCenter = /*#__PURE__*/ def(AlignCenter);
export const IconAlignRight = /*#__PURE__*/ def(AlignRight);
export const IconSliders = /*#__PURE__*/ def(SlidersHorizontal);
export const IconPalette = /*#__PURE__*/ def(Palette);
export const IconColor = /*#__PURE__*/ def(Droplet);
export const IconEdit = /*#__PURE__*/ def(Pencil);

/* ── Object actions ──────────────────────────────────────────────────────── */
export const IconCopy = /*#__PURE__*/ def(Copy);
export const IconDelete = /*#__PURE__*/ def(Trash2);
export const IconDownload = /*#__PURE__*/ def(Download);
export const IconUpload = /*#__PURE__*/ def(Upload);
export const IconShare = /*#__PURE__*/ def(Share2);
export const IconFavorite = /*#__PURE__*/ def(Heart);
export const IconStar = /*#__PURE__*/ def(Star);
export const IconLink = /*#__PURE__*/ def(Link);
export const IconVisible = /*#__PURE__*/ def(Eye);
export const IconHidden = /*#__PURE__*/ def(EyeOff);
export const IconLocked = /*#__PURE__*/ def(Lock);
export const IconUnlocked = /*#__PURE__*/ def(Unlock);
export const IconUndo = /*#__PURE__*/ def(Undo2);
export const IconRedo = /*#__PURE__*/ def(Redo2);
/* The paper plane leans up-right; pull it back toward the optical centre. */
export const IconSend = /*#__PURE__*/ def(Send, [-0.5, 0.5]);

/* ── Generation ──────────────────────────────────────────────────────────── */
export const IconGenerate = /*#__PURE__*/ def(Sparkles);
export const IconWand = /*#__PURE__*/ def(Wand);
export const IconNode = /*#__PURE__*/ def(Box);
export const IconGraph = /*#__PURE__*/ def(Workflow);
export const IconMention = /*#__PURE__*/ def(AtSign);

/* ── Layout / views ──────────────────────────────────────────────────────── */
export const IconGrid = /*#__PURE__*/ def(Grid2x2);
export const IconList = /*#__PURE__*/ def(List);
export const IconTable = /*#__PURE__*/ def(Table);

/* ── Marketing & content ─────────────────────────────────────────────────── */
export const IconIndustry = /*#__PURE__*/ def(Building2);
export const IconAgency = /*#__PURE__*/ def(Briefcase);
export const IconBrand = /*#__PURE__*/ def(Tag);
export const IconCommerce = /*#__PURE__*/ def(ShoppingBag);
export const IconCampaign = /*#__PURE__*/ def(Megaphone);
export const IconGrowth = /*#__PURE__*/ def(TrendingUp);
export const IconTarget = /*#__PURE__*/ def(Target);
export const IconSpeed = /*#__PURE__*/ def(Gauge);
export const IconCalendar = /*#__PURE__*/ def(Calendar);
