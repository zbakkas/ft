import { ForwardRefExoticComponent, RefAttributes } from "react";
import { LucideProps } from "lucide-react";

export interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  size: string;
  players: string;
  mustBeLogged: boolean;
  actionButtons: string[];
  links: string[];
}

export interface Notification {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
