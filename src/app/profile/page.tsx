"use client"

import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/Logo"
import { Input } from "@/components/ui/input"
import { normalizeProfile, strictnessLabels } from "@/lib/profile"
import { createClient } from "@/lib/supabase/client"
import { TRADITION_LABELS, type Strictness, type Tradition } from "@/types"
import { LogOut, Plus, Trash2, Users, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const allergyOptions = ["Nuts", "Dairy", "Gluten", "Soy", "Shellfish", "Sesame"]
const traditionsList = ["satvik", "jain", "halal", "kosher", "christian", "custom"] as Tradition[]

interface FamilyProfile {
  id: string
  name: string
  tradition: Tradition
  subTradition: string | null
  strictness: Strictness
  allergies: string[]
  dislikes: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile] = useState(() => {
    if (typeof window === "undefined") {
      return normalizeProfile()
    }

    const saved = window.localStorage.getItem("bhojan-profile")
    if (!saved) return normalizeProfile()

    try {
      return normalizeProfile(JSON.parse(saved))
    } catch {
      return normalizeProfile()
    }
  })

  // Family profiles local state
  const [familyMembers, setFamilyMembers] = useState<FamilyProfile[]>(() => {
    if (typeof window === "undefined") return []
    const saved = window.localStorage.getItem("bhojan-family-profiles")
    return saved ? JSON.parse(saved) : []
  })

  const [showAddForm, setShowAddForm] = useState(false)
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberTradition, setNewMemberTradition] = useState<Tradition>("satvik")
  const [newMemberStrictness, setNewMemberStrictness] = useState<Strictness>("standard")
  const [newMemberAllergies, setNewMemberAllergies] = useState<string[]>([])
  const [newMemberDislikes, setNewMemberDislikes] = useState("")

  const toggleAllergy = (allergy: string) => {
    setNewMemberAllergies((current) =>
      current.includes(allergy) ? current.filter((item) => item !== allergy) : [...current, allergy]
    )
  }

  const addFamilyMember = () => {
    if (!newMemberName.trim()) return

    const dislikesList = newMemberDislikes
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    const newMember = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      tradition: newMemberTradition,
      subTradition: null,
      strictness: newMemberStrictness,
      allergies: newMemberAllergies,
      dislikes: dislikesList
    }

    const updated = [...familyMembers, newMember]
    setFamilyMembers(updated)
    window.localStorage.setItem("bhojan-family-profiles", JSON.stringify(updated))

    // Reset Form
    setNewMemberName("")
    setNewMemberTradition("satvik")
    setNewMemberStrictness("standard")
    setNewMemberAllergies([])
    setNewMemberDislikes("")
    setShowAddForm(false)
  }

  const deleteFamilyMember = (id: string) => {
    const updated = familyMembers.filter((member) => member.id !== id)
    setFamilyMembers(updated)
    window.localStorage.setItem("bhojan-family-profiles", JSON.stringify(updated))
  }

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      window.localStorage.removeItem("bhojan-profile")
      window.localStorage.removeItem("bhojan-family-profiles")
    }
    router.push("/")
    router.refresh()
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <Logo className="mb-6" />
      <h1 className="font-heading text-[32px] font-semibold text-[#1A1A1A]">Profile</h1>

      {/* Primary User Profile */}
      <section className="mt-8 rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm">
        <p className="text-xs font-medium text-[#666666]">My Personal Practice</p>
        <h2 className="mt-2 font-heading text-2xl font-medium text-[#1A1A1A]">
          {TRADITION_LABELS[profile.tradition]}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#FAFAF7] p-3">
            <p className="text-[11px] font-medium text-[#666666]">Sub-tradition</p>
            <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{profile.subTradition ?? "Not set"}</p>
          </div>
          <div className="rounded-xl bg-[#FAFAF7] p-3">
            <p className="text-[11px] font-medium text-[#666666]">Strictness</p>
            <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{strictnessLabels[profile.strictness]}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-[#666666]">Allergies</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.allergies.length ? (
              profile.allergies.map((item) => (
                <span className="rounded-full bg-[#FDECEA] px-3 py-1 text-xs font-medium text-[#C0392B]" key={item}>
                  {item}
                </span>
              ))
            ) : (
              <p className="text-sm text-[#666666]">None saved</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-[#666666]">Also avoided</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.dislikes.length ? (
              profile.dislikes.map((item) => (
                <span className="rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-medium text-[#1A1A1A]" key={item}>
                  {item}
                </span>
              ))
            ) : (
              <p className="text-sm text-[#666666]">None saved</p>
            )}
          </div>
        </div>
      </section>

      {/* Custom Rules Builder */}
      {profile.tradition === "custom" && (
        <section className="mt-6 rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#E8E3DC]/40 pb-4">
            <Sparkles className="size-5 text-[#C17A2E]" />
            <h2 className="font-heading text-xl font-medium text-[#1A1A1A]">Custom Rule Builder</h2>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#666666]">
            Configure custom ingredient constraints. Bhojan will automatically flag any of these keywords as &apos;Avoid&apos; during menu scans.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Custom Restrictions</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {profile.dislikes.length ? (
                  profile.dislikes.map((item) => (
                    <span className="rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-medium text-[#1A1A1A]" key={item}>
                      🚫 {item}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[#666666] italic">No custom restrictions defined yet.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Custom Allergies</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {profile.allergies.length ? (
                  profile.allergies.map((item) => (
                    <span className="rounded-full bg-[#FDECEA] px-3 py-1 text-xs font-medium text-[#C0392B]" key={item}>
                      ⚠️ {item}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[#666666] italic">No allergies defined yet.</p>
                )}
              </div>
            </div>
            
            <div className="border-t border-[#E8E3DC]/40 pt-3">
              <p className="text-[10px] text-[#666666] leading-4">
                💡 Need to add or remove items? Tap <strong>&apos;Edit Setup&apos;</strong> below to launch the 3-step configuration wizard.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Family Profiles Management */}
      <section className="mt-6 rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#E8E3DC]/40 pb-4">
          <Users className="size-5 text-[#C17A2E]" />
          <h2 className="font-heading text-xl font-medium text-[#1A1A1A]">Family Profiles</h2>
        </div>

        <div className="mt-4 space-y-4">
          {familyMembers.length ? (
            familyMembers.map((member) => (
              <div className="flex items-start justify-between rounded-xl bg-[#FAFAF7] p-4" key={member.id}>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{member.name}</p>
                  <p className="mt-1 text-xs font-medium text-[#C17A2E]">
                    {TRADITION_LABELS[member.tradition as Tradition]} • {strictnessLabels[member.strictness as Strictness]}
                  </p>
                  {member.allergies.length > 0 && (
                    <p className="mt-2 text-[11px] text-[#C0392B]">
                      <span className="font-medium">Allergies:</span> {member.allergies.join(", ")}
                    </p>
                  )}
                  {member.dislikes.length > 0 && (
                    <p className="mt-1 text-[11px] text-[#666666]">
                      <span className="font-medium">Avoids:</span> {member.dislikes.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  aria-label={`Delete ${member.name}`}
                  className="rounded p-1 text-[#666666] hover:bg-[#F5F0E8] hover:text-[#C0392B]"
                  onClick={() => deleteFamilyMember(member.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#666666]">No family profiles added yet. Scan menus for yourself, or add family members below.</p>
          )}
        </div>

        {/* Add Family Member Form */}
        {showAddForm ? (
          <div className="mt-6 border-t border-[#E8E3DC]/60 pt-6">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Add Family Member</h3>
            
            <label className="mt-4 block text-xs font-semibold text-[#666666]" htmlFor="member-name">
              Name
            </label>
            <Input
              className="mt-2 min-h-10 rounded-xl border-[#E8E3DC] bg-white"
              id="member-name"
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="e.g., Aria, Dad"
              required
              value={newMemberName}
            />

            <label className="mt-4 block text-xs font-semibold text-[#666666]">
              Tradition
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {traditionsList.map((t) => (
                <button
                  className={`min-h-10 rounded-lg border text-[11px] font-medium capitalize transition ${
                    newMemberTradition === t
                      ? "border-[#C17A2E] bg-[#FFF8E1] text-[#1A1A1A]"
                      : "border-[#E8E3DC] bg-white text-[#666666]"
                  }`}
                  key={t}
                  onClick={() => setNewMemberTradition(t)}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#666666]">
              Strictness
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(strictnessLabels) as Strictness[]).map((s) => (
                <button
                  className={`min-h-10 rounded-lg border text-[11px] font-medium transition ${
                    newMemberStrictness === s
                      ? "border-[#C17A2E] bg-[#FFF8E1] text-[#1A1A1A]"
                      : "border-[#E8E3DC] bg-white text-[#666666]"
                  }`}
                  key={s}
                  onClick={() => setNewMemberStrictness(s)}
                  type="button"
                >
                  {strictnessLabels[s]}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#666666]">
              Allergies
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allergyOptions.map((a) => (
                <button
                  className={`min-h-9 rounded-full border px-3 text-xs font-medium transition ${
                    newMemberAllergies.includes(a)
                      ? "border-[#C17A2E] bg-[#C17A2E] text-white"
                      : "border-[#E8E3DC] bg-white text-[#1A1A1A]"
                  }`}
                  key={a}
                  onClick={() => toggleAllergy(a)}
                  type="button"
                >
                  {a}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#666666]" htmlFor="member-avoids">
              Avoided Ingredients (comma separated)
            </label>
            <Input
              className="mt-2 min-h-10 rounded-xl border-[#E8E3DC] bg-white"
              id="member-avoids"
              onChange={(e) => setNewMemberDislikes(e.target.value)}
              placeholder="e.g., Eggplant, Cilantro"
              value={newMemberDislikes}
            />

            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1 min-h-11 rounded-full border-[#E8E3DC]"
                onClick={() => setShowAddForm(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 min-h-11 rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
                disabled={!newMemberName.trim()}
                onClick={addFamilyMember}
                type="button"
              >
                Save Profile
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="mt-4 min-h-11 w-full rounded-xl border-dashed border-[#C17A2E]/40 text-[#C17A2E] hover:bg-[#FFF8E1]"
            onClick={() => setShowAddForm(true)}
            variant="outline"
          >
            <Plus className="size-4" />
            Add Family Profile
          </Button>
        )}
      </section>

      {/* Setup Actions */}
      <Button
        className="mt-6 min-h-12 w-full rounded-xl border-[#E8E3DC] bg-white text-[#1A1A1A] hover:bg-[#FAFAF7]"
        onClick={() => router.push("/onboarding")}
        variant="outline"
      >
        Edit Setup
      </Button>
      <Button
        className="mt-3 min-h-12 w-full rounded-xl border-[#E8E3DC] bg-white text-[#1A1A1A] hover:bg-[#FAFAF7]"
        onClick={() => router.push("/guide")}
        variant="outline"
      >
        Practice Guide
      </Button>
      <Button className="mt-3 min-h-12 w-full rounded-xl text-[#C0392B] hover:bg-[#FDECEA]" onClick={signOut} variant="ghost">
        <LogOut className="size-4" />
        Sign Out
      </Button>

      <BottomNav />
    </main>
  )
}

