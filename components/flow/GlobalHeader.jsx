import { Building2, Search, Bell, HelpCircle, Settings, Sun, Moon, Grid3x3, Download } from "lucide-react";

export const GlobalHeader = ({ theme, onToggleTheme }) => {
  return (
    <header
      data-testid="global-header"
      className="sticky top-0 z-40 bg-[#03234D] dark:bg-[#060d1f] text-white shadow-md"
    >
      <div className="flex items-center gap-3 px-4 h-14">
        <div className="flex items-center gap-2 pr-3 mr-1 border-r border-white/15">
          <div className="grid place-items-center h-8 w-8 rounded-md bg-[#0176D3]">
            <Building2 className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-none">
            <div className="font-heading font-bold text-[15px] tracking-tight">Meridian<span className="text-sky-300">One</span></div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">Commercial Banking CRM</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-[13px]">
          {["Home", "Relationships", "Onboarding", "Reports"].map((t, i) => (
            <button
              key={t}
              data-testid={`nav-${t.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                i === 2 ? "bg-white/15 font-semibold" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-md hidden lg:block mx-2">
          <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-colors duration-150 rounded-md px-3 h-9">
            <Search className="h-4 w-4 text-white/60" />
            <input
              data-testid="global-search-input"
              placeholder="Search Salesforce"
              className="bg-transparent outline-none text-sm placeholder:text-white/45 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <a
            data-testid="download-sf-package"
            href={`${process.env.REACT_APP_BACKEND_URL || ""}/api/scaffold/download`}
            title="Download Salesforce metadata package (LWC + Flow + Apex)"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 mr-1 rounded-md bg-white/10 hover:bg-white/20 text-[13px] font-medium transition-colors duration-150"
          >
            <Download className="h-4 w-4" /> SF Package
          </a>
          <button
            data-testid="theme-toggle"
            onClick={onToggleTheme}
            title="Toggle theme"
            className="grid place-items-center h-9 w-9 rounded-md hover:bg-white/10 transition-colors duration-150"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          {[Grid3x3, HelpCircle, Bell, Settings].map((Icon, i) => (
            <button key={i} className="grid place-items-center h-9 w-9 rounded-md hover:bg-white/10 transition-colors duration-150 hidden sm:grid">
              <Icon className="h-[18px] w-[18px] text-white/80" />
            </button>
          ))}
          <div className="ml-1 grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[13px] font-semibold">
            RM
          </div>
        </div>
      </div>
    </header>
  );
};
