import {
  Globe, Server, Code, Shield, Mail, MoreHorizontal,
  Cloud, Database, Smartphone, Monitor, Wifi, Lock,
  Key, CreditCard, FileText, Folder, HardDrive, Headphones,
  Image, Layers, Link, Map, MessageSquare, Music,
  Package, Phone, Printer, Radio, Search, Settings,
  ShoppingCart, Star, Tag, Tv, Upload, Video,
  Zap, BookOpen, Briefcase, Building, Camera, Cpu,
  type LucideIcon,
} from 'lucide-react';

/** Curated icon set for service type selection */
export const SERVICE_TYPE_ICONS: Record<string, LucideIcon> = {
  Globe,
  Server,
  Code,
  Shield,
  Mail,
  Cloud,
  Database,
  Smartphone,
  Monitor,
  Wifi,
  Lock,
  Key,
  CreditCard,
  FileText,
  Folder,
  HardDrive,
  Headphones,
  Image,
  Layers,
  Link,
  Map,
  MessageSquare,
  Music,
  Package,
  Phone,
  Printer,
  Radio,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Tv,
  Upload,
  Video,
  Zap,
  BookOpen,
  Briefcase,
  Building,
  Camera,
  Cpu,
  MoreHorizontal,
};

/** All available icon names in display order */
export const SERVICE_TYPE_ICON_NAMES = Object.keys(SERVICE_TYPE_ICONS);

/** Resolve an icon name to a LucideIcon component. Falls back to MoreHorizontal. */
export const getServiceTypeIcon = (iconName?: string): LucideIcon =>
  (iconName && SERVICE_TYPE_ICONS[iconName]) || MoreHorizontal;
