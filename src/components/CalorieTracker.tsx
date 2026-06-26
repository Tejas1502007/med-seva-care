import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Search, TrendingUp } from "lucide-react";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: string;
  protein: string;
  fat: string;
  time: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
}

interface NutritionInfo {
  name: string;
  calories: number;
  carbs: string;
  protein: string;
  fat: string;
  fiber: string;
  sugar: string;
  servingSize: string;
  healthBenefits: string;
  warnings?: string;
}

interface DailyGoals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface CaloriTrackerProps {
  userId: string;
  condition?: string;
  dailyGoals?: DailyGoals;
}

export function CalorieTracker({
  userId,
  condition = "General",
  dailyGoals = { calories: 2000, carbs: 225, protein: 50, fat: 65 },
}: CaloriTrackerProps) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [searchFood, setSearchFood] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NutritionInfo | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [showForm, setShowForm] = useState(false);

  // Load entries from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`calorie_tracker_${userId}_${today}`);
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, [userId]);

  // Save entries to localStorage
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(`calorie_tracker_${userId}_${today}`, JSON.stringify(entries));
  }, [entries, userId]);

  const searchFood_Nutrition = async () => {
    if (!searchFood.trim()) {
      toast.error("Please enter a food name");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch("/api/nutrition/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: searchFood }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to find nutrition info");
        return;
      }

      if (data.nutrition) {
        setSelectedFood(data.nutrition);
        toast.success("Food found! Click to add to diet");
      } else {
        toast.error("Food not found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for food");
    } finally {
      setSearching(false);
    }
  };

  const addFoodEntry = () => {
    if (!selectedFood) {
      toast.error("Please select a food first");
      return;
    }

    const newEntry: FoodEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedFood.name,
      calories: selectedFood.calories,
      carbs: selectedFood.carbs,
      protein: selectedFood.protein,
      fat: selectedFood.fat,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      meal: selectedMeal,
    };

    setEntries([...entries, newEntry]);
    setSelectedFood(null);
    setSearchFood("");
    setShowForm(false);
    toast.success(`✓ ${selectedFood.name} added to ${selectedMeal}`);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
    toast.success("Food removed");
  };

  // Calculate daily totals
  const calculateTotals = () => {
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        carbs: acc.carbs + parseInt(entry.carbs),
        protein: acc.protein + parseInt(entry.protein),
        fat: acc.fat + parseInt(entry.fat),
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );
  };

  const totals = calculateTotals();
  const mealEntries = (meal: string) =>
    entries.filter((e) => e.meal === meal);

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage <= 100) return "#0D7A5F"; // Green
    if (percentage <= 110) return "#B45309"; // Orange
    return "#B91C1C"; // Red
  };

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="card-base p-6">
        <h3 className="text-base font-semibold mb-4" style={{ color: "#1A2332" }}>
          Add Food to Today's Diet
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search food (e.g., Apple, Chicken Curry, Oats)"
            value={searchFood}
            onChange={(e) => setSearchFood(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchFood_Nutrition()}
            disabled={searching}
            className="flex-1 h-11 px-4 rounded-lg border bg-white text-sm disabled:opacity-50"
            style={{ borderColor: "#D1D5DB" }}
          />
          <button
            onClick={searchFood_Nutrition}
            disabled={searching}
            className="h-11 px-4 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: "#0D7A5F" }}
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {selectedFood && (
          <div className="p-4 rounded-lg mb-4" style={{ background: "#F0FDF4" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold" style={{ color: "#15803D" }}>
                  {selectedFood.name}
                </h4>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                  {selectedFood.servingSize}
                </p>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-xs px-2 py-1"
                style={{ color: "#6B7280" }}
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "#15803D" }}>
                  {selectedFood.calories}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>
                  kcal
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold" style={{ color: "#6B7280" }}>
                  {selectedFood.carbs}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>
                  Carbs
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold" style={{ color: "#6B7280" }}>
                  {selectedFood.protein}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>
                  Protein
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold" style={{ color: "#6B7280" }}>
                  {selectedFood.fat}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>
                  Fat
                </div>
              </div>
            </div>

            {selectedFood.healthBenefits && (
              <p className="text-xs mb-3" style={{ color: "#374151" }}>
                ✓ {selectedFood.healthBenefits}
              </p>
            )}

            <div className="flex gap-2">
              <select
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value as any)}
                className="flex-1 h-9 px-3 rounded-lg border text-sm"
                style={{ borderColor: "#D1D5DB" }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <button
                onClick={addFoodEntry}
                className="h-9 px-4 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
                style={{ background: "#15803D" }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Daily Summary */}
      <div className="card-base p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} color="#0D7A5F" />
          <h3 className="text-base font-semibold" style={{ color: "#1A2332" }}>
            Today's Nutrition Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Calories */}
          <div className="p-4 rounded-lg" style={{ background: "#F7F8FA" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>
                CALORIES
              </span>
              <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {Math.round((totals.calories / dailyGoals.calories) * 100)}%
              </span>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: "#1A2332" }}>
              {totals.calories}
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#E8ECF0" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((totals.calories / dailyGoals.calories) * 100, 100)}%`,
                  background: getProgressColor(totals.calories, dailyGoals.calories),
                }}
              />
            </div>
            <div className="text-xs mt-2" style={{ color: "#6B7280" }}>
              of {dailyGoals.calories} kcal
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 rounded-lg" style={{ background: "#F7F8FA" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>
                CARBS
              </span>
              <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {Math.round((totals.carbs / dailyGoals.carbs) * 100)}%
              </span>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: "#1A2332" }}>
              {totals.carbs}g
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#E8ECF0" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((totals.carbs / dailyGoals.carbs) * 100, 100)}%`,
                  background: getProgressColor(totals.carbs, dailyGoals.carbs),
                }}
              />
            </div>
            <div className="text-xs mt-2" style={{ color: "#6B7280" }}>
              of {dailyGoals.carbs}g
            </div>
          </div>

          {/* Protein */}
          <div className="p-4 rounded-lg" style={{ background: "#F7F8FA" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>
                PROTEIN
              </span>
              <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {Math.round((totals.protein / dailyGoals.protein) * 100)}%
              </span>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: "#1A2332" }}>
              {totals.protein}g
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#E8ECF0" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((totals.protein / dailyGoals.protein) * 100, 100)}%`,
                  background: getProgressColor(totals.protein, dailyGoals.protein),
                }}
              />
            </div>
            <div className="text-xs mt-2" style={{ color: "#6B7280" }}>
              of {dailyGoals.protein}g
            </div>
          </div>

          {/* Fat */}
          <div className="p-4 rounded-lg" style={{ background: "#F7F8FA" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>
                FAT
              </span>
              <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                {Math.round((totals.fat / dailyGoals.fat) * 100)}%
              </span>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: "#1A2332" }}>
              {totals.fat}g
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#E8ECF0" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((totals.fat / dailyGoals.fat) * 100, 100)}%`,
                  background: getProgressColor(totals.fat, dailyGoals.fat),
                }}
              />
            </div>
            <div className="text-xs mt-2" style={{ color: "#6B7280" }}>
              of {dailyGoals.fat}g
            </div>
          </div>
        </div>
      </div>

      {/* Meals by Type */}
      {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
        <div key={meal} className="card-base p-6">
          <h4 className="text-base font-semibold mb-4 capitalize" style={{ color: "#1A2332" }}>
            {meal} ({mealEntries(meal).length} items)
          </h4>

          {mealEntries(meal).length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>
              No items added yet
            </p>
          ) : (
            <div className="space-y-2">
              {mealEntries(meal).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "#F7F8FA" }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                      {entry.name}
                    </div>
                    <div className="text-xs mt-1 flex gap-4" style={{ color: "#6B7280" }}>
                      <span>{entry.calories} kcal</span>
                      <span>{entry.carbs} carbs</span>
                      <span>{entry.protein} protein</span>
                      <span>{entry.fat} fat</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
