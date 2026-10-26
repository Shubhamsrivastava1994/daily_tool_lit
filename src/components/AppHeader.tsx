import { Wrench } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="LittleTools home">
        <span className="brand-icon"><Wrench size={19}/></span>
        <span>LittleTools<small>YOUR SIMPLE TOOLBOX</small></span>
      </a>
      <span className="topbar-note">Free browser tools</span>
    </header>
  );
}