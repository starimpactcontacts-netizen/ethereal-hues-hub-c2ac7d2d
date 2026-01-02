interface FilterBarProps {
  activeStatus: string;
  activeLocation: string;
  activeCategory: string;
  onStatusChange: (status: string) => void;
  onLocationChange: (location: string) => void;
  onCategoryChange: (category: string) => void;
  locations: string[];
  categories: string[];
}

export const FilterBar = ({
  activeStatus,
  activeLocation,
  activeCategory,
  onStatusChange,
  onLocationChange,
  onCategoryChange,
  locations,
  categories
}: FilterBarProps) => {
  const statusOptions = ["All", "Upcoming", "Live", "Past"];

  const FilterPill = ({ 
    label, 
    isActive, 
    onClick 
  }: { 
    label: string; 
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-[11px] uppercase tracking-[0.1em] rounded-full transition-all duration-200 ${
        isActive 
          ? "bg-foreground text-background" 
          : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
          Status
        </span>
        <div className="flex gap-2">
          {statusOptions.map((status) => (
            <FilterPill
              key={status}
              label={status}
              isActive={activeStatus === status}
              onClick={() => onStatusChange(status)}
            />
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
          Location
        </span>
        <select
          value={activeLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          className="px-4 py-2 text-[11px] uppercase tracking-[0.1em] rounded-full bg-secondary text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyA0LjVMNiA3LjVMOSA0LjUiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_12px]"
        >
          <option value="All">All</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
          Discipline
        </span>
        <select
          value={activeCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2 text-[11px] uppercase tracking-[0.1em] rounded-full bg-secondary text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors appearance-none pr-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyA0LjVMNiA3LjVMOSA0LjUiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_12px]"
        >
          <option value="All">All</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
