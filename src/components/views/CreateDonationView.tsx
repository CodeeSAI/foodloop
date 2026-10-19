import React, { useState } from 'react';
import { useFoodLoop, DONOR_ORGANIZATIONS } from '../../context/FoodLoopContext';
import { FoodCategory, StorageType } from '../../types';

export const CreateDonationView: React.FC = () => {
  const { addDonation, setActiveView, selectedKitchenId } = useFoodLoop();

  const [donorKitchenId, setDonorKitchenId] = useState<string>(() => {
    return selectedKitchenId !== 'all' ? selectedKitchenId : 'grand_hyatt';
  });

  // Form State
  const [category, setCategory] = useState<FoodCategory>('hot_meals');
  const [title, setTitle] = useState('');

  const initialOrg = DONOR_ORGANIZATIONS.find(o => o.id === (selectedKitchenId !== 'all' ? selectedKitchenId : 'grand_hyatt')) || DONOR_ORGANIZATIONS[0];
  const [donorName, setDonorName] = useState(initialOrg.name);
  const [donorLocation, setDonorLocation] = useState(initialOrg.sub);
  const [donorAddress, setDonorAddress] = useState(initialOrg.address);
  const [quantityKg, setQuantityKg] = useState<number>(45);
  const [servings, setServings] = useState<number>(120);
  const [packaging, setPackaging] = useState('Insulated Cambro Thermal Totes');
  const [storageType, setStorageType] = useState<StorageType>('hot');
  const [tempTargetC, setTempTargetC] = useState<number>(65);
  const [expiryHours, setExpiryHours] = useState<number>(2.5);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(['Gluten (Wheat)', 'Dairy (Butter)']);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['Halal Poultry', 'Nut-Free']);
  const [notes, setNotes] = useState('Prepared from executive banquet lunch service. Maintained in commercial warming cabinets under strict HACCP protocol.');

  const handleKitchenChange = (kId: string) => {
    setDonorKitchenId(kId);
    const org = DONOR_ORGANIZATIONS.find(o => o.id === kId) || DONOR_ORGANIZATIONS[0];
    setDonorName(org.name);
    setDonorLocation(org.sub);
    setDonorAddress(org.address);
  };

  // Update donor details if kitchen is changed in header
  React.useEffect(() => {
    const kId = selectedKitchenId !== 'all' ? selectedKitchenId : 'grand_hyatt';
    handleKitchenChange(kId);
  }, [selectedKitchenId]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic ESG Forecast
  const estimatedMeals = Math.round(quantityKg * 2.6);
  const estimatedCo2e = (quantityKg * 2.14).toFixed(1);

  // Auto-adjust storage and temp defaults on category change
  const handleCategoryChange = (newCat: FoodCategory) => {
    setCategory(newCat);
    if (newCat === 'hot_meals') {
      setStorageType('hot');
      setTempTargetC(65);
      setPackaging('Insulated Cambro Thermal Totes');
    } else if (newCat === 'dairy') {
      setStorageType('chilled');
      setTempTargetC(3);
      setPackaging('Refrigerated Crates');
    } else if (newCat === 'produce') {
      setStorageType('ambient');
      setTempTargetC(14);
      setPackaging('Ventilated Field Crates');
    } else if (newCat === 'bakery') {
      setStorageType('ambient');
      setTempTargetC(20);
      setPackaging('Food-grade Paper Liners & Bins');
    } else {
      setStorageType('ambient');
      setTempTargetC(20);
      setPackaging('Corrugated Cardboard Cartons');
    }
  };

  const toggleAllergen = (item: string) => {
    setSelectedAllergens(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleDietary = (item: string) => {
    setSelectedDietary(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = 'Please provide a descriptive title for this surplus lot (minimum 3 characters).';
    }
    if (quantityKg <= 0) {
      newErrors.quantity = 'Surplus weight must be greater than 0 kg.';
    } else if (quantityKg > 5000) {
      newErrors.quantity = 'Weight cannot exceed 5,000 kg for standard dispatch.';
    }
    if (servings <= 0) {
      newErrors.servings = 'Estimated servings must be at least 1 meal.';
    }
    if (!packaging.trim()) {
      newErrors.packaging = 'Please specify packaging container or enclosure.';
    }

    // HACCP Temperature Standards
    if (storageType === 'hot' && tempTargetC < 55) {
      newErrors.tempTargetC = 'HACCP Rule: Hot-holding meals must be kept at 55°C or higher to inhibit microbial growth.';
    } else if (storageType === 'chilled' && tempTargetC > 8) {
      newErrors.tempTargetC = 'HACCP Rule: Chilled food must be kept at 8°C or lower to preserve cold-chain integrity.';
    } else if (storageType === 'ambient' && (tempTargetC < 5 || tempTargetC > 35)) {
      newErrors.tempTargetC = 'Ambient storage core temp must be between 5°C and 35°C.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const expiryDate = new Date(Date.now() + expiryHours * 60 * 60000);
    const deadlineStr = `Today, ${expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    addDonation({
      title: title.trim(),
      category,
      donorKitchenId,
      donorName,
      donorLocation,
      donorAddress,
      quantityKg: Number(quantityKg),
      servings: Number(servings || estimatedMeals),
      packaging,
      storageType,
      tempTargetC: Number(tempTargetC),
      cookedOrPackedAt: 'Today, Just Now',
      expiryDeadline: deadlineStr,
      expiryMinutesRemaining: Math.round(expiryHours * 60),
      allergens: selectedAllergens,
      dietaryTags: selectedDietary,
      pickupWindow: 'Within 30-45 minutes',
      notes,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      // Automatically route to Recipient Matching
      setActiveView('matching');
    }, 350);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Stepper with Frosted Glass */}
      <div className="glass-panel-dark p-5 sm:p-6 rounded-3xl shadow-md border border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-tech-label text-lime-accent">
            Surplus Redistribution Protocol
          </span>
          <span className="text-tech-label text-sage-pale/80 font-normal bg-black/40 border border-white/10 px-2 py-0.5 rounded-md lowercase tracking-normal">
            Step 1 of 2
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-3.5">
          <h1 className="text-page-title text-white">
            Publish Surplus Food Lot
          </h1>
          <span className="text-tech-label text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
            Logistics Active
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-black/40 border border-white/10 rounded-full overflow-hidden flex gap-1 shadow-inner">
          <div className="h-full w-1/2 bg-lime-accent rounded-full"></div>
          <div className="h-full w-1/2 bg-white/15 rounded-full"></div>
        </div>
        <div className="flex justify-between mt-2 font-mono text-xs">
          <span className="text-lime-accent font-semibold">1. Food Inventory &amp; HACCP</span>
          <span className="text-sage-pale/60">2. Recipient Match &amp; Route</span>
        </div>
      </div>

      {/* Live ESG Micro-Banner (Frosted Dark Glass with Ambient Glow) */}
      <div className="glass-panel-dark text-white p-6 rounded-3xl shadow-md relative overflow-hidden border border-white/10">
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -right-8 -bottom-8 w-44 h-44 bg-lime-accent/20 rounded-full blur-3xl"
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lime-accent text-[18px]">eco</span>
              <span className="text-tech-label text-sage-pale">
                Immediate ESG Forecast (Dynamic)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-metric-value text-white">~{estimatedMeals}</span>
              <span className="text-subheading text-sage-pale font-normal">nourishing meals saved from waste</span>
            </div>
            <p className="text-supporting text-lime-accent/90 font-mono">
              Offsets approximately {estimatedCo2e} kg CO₂e greenhouse gas emission
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-lime-accent shadow-inner">
            <span className="material-symbols-outlined text-[26px]">electric_bolt</span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Active Origin Commercial Kitchen Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A291E]/80 rounded-3xl border border-lime-accent/30 shadow-md gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-lime-accent/15 border border-lime-accent/35 text-lime-accent flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">restaurant</span>
            </div>
            <div className="min-w-0">
              <div className="text-tech-label text-sage-pale/80 font-normal">Origin Commercial Kitchen</div>
              <div className="text-subheading text-white font-bold truncate">{donorName}</div>
              <div className="text-supporting text-sage-pale font-mono text-xs truncate">{donorLocation} &bull; {donorAddress}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-tech-label text-sage-pale/70 text-xs hidden sm:inline">Change Origin:</label>
            <select
              value={donorKitchenId}
              onChange={(e) => handleKitchenChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-white/15 bg-black/50 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-lime-accent/30 transition-all shadow-inner"
            >
              {DONOR_ORGANIZATIONS.map((k) => (
                <option key={k.id} value={k.id} className="bg-[#0B2A20] text-white">
                  {k.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 1: Category Selection */}
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-4 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <label className="text-card-title text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-lime-accent/20 border border-lime-accent/30 text-lime-accent flex items-center justify-center text-xs font-mono font-bold">1</span>
              Food Category
            </label>
            <span className="text-tech-label text-sage-pale/70 font-normal">Select classification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'hot_meals', label: 'Hot Cooked Meals', sub: 'Buffets, roasts, pasta, entrees', icon: 'soup_kitchen' },
              { id: 'bakery', label: 'Bakery & Pastries', sub: 'Artisan bread, baguettes, buns', icon: 'bakery_dining' },
              { id: 'produce', label: 'Fresh Farm Produce', sub: 'Vegetables, leafy greens, fruit', icon: 'nutrition' },
              { id: 'dairy', label: 'Chilled Dairy', sub: 'Milk, artisan cheeses, yogurt', icon: 'ac_unit' },
              { id: 'pantry', label: 'Pantry Staples', sub: 'Canned goods, grains, dry goods', icon: 'shelves' },
            ].map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id as FoodCategory)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 relative group ${
                    isSelected
                      ? 'bg-lime-accent/20 text-white border-lime-accent shadow-md ring-2 ring-lime-accent/40 translate-y-[-2px]'
                      : 'glass-subcard text-white hover:border-lime-accent/35'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
                    isSelected ? 'bg-lime-accent text-forest' : 'bg-white/10 text-lime-accent border border-white/10'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-subheading font-bold truncate text-white">{cat.label}</div>
                    <div className={`text-supporting text-[12px] truncate mt-0.5 ${isSelected ? 'text-lime-accent/90' : 'text-sage-pale/70'}`}>
                      {cat.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Lot Details & Quantities */}
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-4 border border-white/10">
          <div className="border-b border-white/10 pb-3">
            <label className="text-card-title text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-lime-accent/20 border border-lime-accent/30 text-lime-accent flex items-center justify-center text-xs font-mono font-bold">2</span>
              Lot Title &amp; Specifications
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-supporting font-bold text-sage-pale mb-1">
                Surplus Item Title &amp; Description <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 120 Warm Catering Trays (Mediterranean Roast Chicken & Rice)"
                className="w-full px-4 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-body-default bg-black/40 text-white placeholder-white/35 transition-all shadow-inner"
              />
              {errors.title && <p className="text-supporting text-red-400 font-medium mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-supporting font-bold text-sage-pale mb-1">
                  Weight (kg) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={quantityKg}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuantityKg(val);
                      setServings(Math.round(val * 2.6));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-tech-data font-bold bg-black/40 text-white transition-all shadow-inner"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tech-label text-sage-pale/60 font-normal">kg</span>
                </div>
                {errors.quantity && <p className="text-supporting text-red-400 font-medium mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-supporting font-bold text-sage-pale mb-1">Estimated Servings</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-tech-data font-bold bg-black/40 text-white transition-all shadow-inner"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tech-label text-sage-pale/60 font-normal">meals</span>
                </div>
                {errors.servings && <p role="alert" className="text-supporting text-red-400 font-medium mt-1">{errors.servings}</p>}
              </div>

              <div>
                <label className="block text-supporting font-bold text-sage-pale mb-1">Packaging Enclosure</label>
                <input
                  type="text"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  placeholder="e.g. Insulated Cambro Thermal Totes"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-body-default bg-black/40 text-white placeholder-white/35 transition-all shadow-inner"
                />
                {errors.packaging && <p role="alert" className="text-supporting text-red-400 font-medium mt-1">{errors.packaging}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Storage & HACCP Temperature Telemetry */}
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-4 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <label className="text-card-title text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-lime-accent/20 border border-lime-accent/30 text-lime-accent flex items-center justify-center text-xs font-mono font-bold">3</span>
              HACCP Cold-Chain &amp; Holding Standards
            </label>
            <span className="text-tech-label text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-medium border border-emerald-500/40">
              HACCP Tier 1 Compliance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-supporting font-bold text-sage-pale mb-1">Storage Condition</label>
              <select
                value={storageType}
                onChange={(e) => setStorageType(e.target.value as StorageType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-body-default bg-black/40 text-white transition-all shadow-inner"
              >
                <option value="hot" className="bg-[#0B2A20] text-white">Hot Holding (&gt; 60°C)</option>
                <option value="chilled" className="bg-[#0B2A20] text-white">Refrigerated / Chilled (2°C - 4°C)</option>
                <option value="ambient" className="bg-[#0B2A20] text-white">Ambient / Room Temp (18°C - 22°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-supporting font-bold text-sage-pale mb-1">Target Core Temp (°C)</label>
              <div className="relative">
                <input
                  type="number"
                  value={tempTargetC}
                  onChange={(e) => setTempTargetC(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-tech-data font-bold bg-black/40 text-white transition-all shadow-inner"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tech-label text-sage-pale/60 font-normal">°C</span>
              </div>
              {errors.tempTargetC && <p role="alert" className="text-supporting text-red-400 font-medium mt-1 leading-tight">{errors.tempTargetC}</p>}
            </div>

            <div>
              <label className="block text-supporting font-bold text-sage-pale mb-1">Safe Consumption Window</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-body-default bg-black/40 text-white transition-all shadow-inner"
              >
                <option value={1.5} className="bg-[#0B2A20] text-white">1.5 Hours (High Spoilage Risk)</option>
                <option value={2.5} className="bg-[#0B2A20] text-white">2.5 Hours (Standard Hot Holding)</option>
                <option value={4} className="bg-[#0B2A20] text-white">4.0 Hours (Chilled Catering)</option>
                <option value={12} className="bg-[#0B2A20] text-white">12 Hours (Fresh Bakery / Produce)</option>
                <option value={24} className="bg-[#0B2A20] text-white">24 Hours (Pantry / Vault)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Dietary & Allergen Constraints */}
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-4 border border-white/10">
          <div className="border-b border-white/10 pb-3">
            <label className="text-card-title text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-lime-accent/20 border border-lime-accent/30 text-lime-accent flex items-center justify-center text-xs font-mono font-bold">4</span>
              Dietary Declarations &amp; Allergen Constraints
            </label>
            <p className="text-supporting text-sage-pale/70 mt-1">
              The deterministic matching engine matches these strict dietary tags with recipient intake criteria.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-tech-label text-lime-accent/90 block mb-2">
                Contains Allergens:
              </span>
              <div className="flex flex-wrap gap-2">
                {['Gluten (Wheat)', 'Dairy (Butter)', 'Peanuts', 'Tree Nuts', 'Soy', 'Shellfish', 'Fish', 'Eggs', 'Sesame'].map((allergen) => {
                  const isChecked = selectedAllergens.includes(allergen);
                  return (
                    <button
                      type="button"
                      key={allergen}
                      onClick={() => toggleAllergen(allergen)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 shadow-2xs ${
                        isChecked
                          ? 'bg-amber-400/25 border-amber-400/60 text-amber-300 font-semibold shadow-xs'
                          : 'bg-white/[0.05] border-white/10 text-sage-pale/80 hover:bg-white/[0.1] hover:text-white'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {allergen}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-tech-label text-emerald-400 block mb-2">
                Dietary Certifications:
              </span>
              <div className="flex flex-wrap gap-2">
                {['Halal Poultry', 'Kosher Prepared', 'Vegetarian', 'Vegan', 'Nut-Free', 'Gluten-Free'].map((tag) => {
                  const isChecked = selectedDietary.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleDietary(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 shadow-2xs ${
                        isChecked
                          ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300 font-semibold shadow-xs'
                          : 'bg-white/[0.05] border-white/10 text-sage-pale/80 hover:bg-white/[0.1] hover:text-white'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Internal Kitchen Notes */}
        <div className="glass-panel-dark rounded-3xl p-5 sm:p-6 shadow-md space-y-3 border border-white/10">
          <label className="text-card-title text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-lime-accent/20 border border-lime-accent/30 text-lime-accent flex items-center justify-center text-xs font-mono font-bold">5</span>
            Operational Notes for Courier &amp; Shelter
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/15 focus:border-lime-accent focus:ring-4 focus:ring-lime-accent/20 outline-none text-body-default bg-black/40 text-white placeholder-white/35 transition-all shadow-inner"
            placeholder="Loading dock instructions, courier entry code, reheating notes..."
          ></textarea>
        </div>

        {/* Form Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="btn-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Submitting to Matrix...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">publish</span>
                <span>Publish Lot &amp; Find Matches &rarr;</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
