"use client";

import Image from "next/image";
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { wedding, type HotelType, type ScheduleType } from "@/lib/wedding";

type PublicGuest = {
  id: string;
  name: string;
  scheduleType: ScheduleType;
  hotelType: HotelType;
  plusOneAllowed: boolean;
  familySize: number | null;
};

type FamilyMember = { name: string; dinner: boolean; wedding: boolean };

const MUSIC_SRC = "/audio/le-cygne.mp3";

type Phase = "checking" | "login" | "envelope" | "opening" | "site";

function scrollToSection(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
  event.preventDefault();
  const target = document.getElementById(sectionId);
  if (!target) return;

  const isMobile = window.matchMedia("(max-width: 800px)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: isMobile ? "start" : "center",
  });

  history.pushState(null, "", `#${sectionId}`);
}

function Login({
  onLogin,
  onUnlockMusic,
  onStopMusic,
}: {
  onLogin: (guest: PublicGuest) => void;
  onUnlockMusic: () => void;
  onStopMusic: () => void;
}) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    // Start music inside the click gesture (before await) so browsers allow playback.
    onUnlockMusic();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const raw = await response.text();
      let data: { error?: string; guest?: PublicGuest } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string; guest?: PublicGuest };
        } catch {
          throw new Error("Unable to open invitation. Please try again.");
        }
      }
      if (!response.ok) throw new Error(data.error || "Unable to open invitation.");
      if (!data.guest) throw new Error("Unable to open invitation.");
      onLogin(data.guest);
    } catch (err) {
      onStopMusic();
      setError(err instanceof Error ? err.message : "Unable to open invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginScreen">
      <Image
        src="/images/log-in-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="loginBackdrop"
      />
      <section className="loginCard" aria-label="Private wedding invitation">
        <Image
          src="/images/SC%20Password%20Card.png"
          alt=""
          fill
          priority
          sizes="(max-width: 800px) 96vw, 760px"
          className="loginCardArt"
        />
        <div className="loginCardInner">
          <p className="loginEyebrow">a private invitation</p>
          <p className="loginFrom">from</p>
          <h1>Sebastian and Charlize</h1>
          <p className="loginPrompt">please enter your invitation code below</p>
          <form onSubmit={submit} className="loginForm">
            <label htmlFor="passcode" className="visuallyHidden">Invitation code</label>
            <input
              id="passcode"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
            {error ? <p className="formError" role="alert">{error}</p> : null}
            <button type="submit" disabled={loading || !passcode.trim()}>
              {loading ? "checking…" : "continue"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Envelope({ guest, opening, onOpen }: { guest: PublicGuest; opening: boolean; onOpen: () => void }) {
  return (
    <main className={`envelopeScreen ${opening ? "isOpening" : ""}`}>
      <Image
        src="/images/log-in-background.png"
        alt=""
        fill
        sizes="100vw"
        className="envelopeBackdrop"
        priority
      />
      <div className="envelopeHeading">
        <p className="envelopeDear">Dear {guest.name}</p>
        <p className="envelopeMailFrom">You&apos;ve got mail from</p>
        <h1><span>Sebastian</span><i>&amp;</i><span>Charlize</span></h1>
      </div>

      <button className="envelopeButton" onClick={onOpen} disabled={opening} aria-label="Open the wedding invitation">
        <div className="envelopeStage">
          <div className="envelopeLayer envelopeBack">
            <Image
              src="/images/1-envelope-background.png"
              alt=""
              fill
              sizes="(max-width: 800px) 90vw, 440px"
              priority
            />
          </div>
          <div className="envelopeLayer envelopeCard">
            <Image
              src="/images/2-save-the-date-doily.png"
              alt="Save the Date"
              fill
              sizes="(max-width: 800px) 90vw, 440px"
              priority
            />
          </div>
          <div className="envelopeLayer envelopeFront">
            <Image
              src="/images/3-envelope-front.png"
              alt=""
              fill
              sizes="(max-width: 800px) 90vw, 440px"
              priority
            />
          </div>
        </div>
        <span className="openLabel">{opening ? "Opening…" : "Click to open invitation"}</span>
      </button>
    </main>
  );
}

function SaveTheDateDoily() {
  return (
    <div className="saveDateDoily">
      <Image
        src="/images/SC%20Lace%20Doily.png"
        alt="We are getting married. Sebastian Suherman and Charlize Sentosa. Save the date, August 14, 2027, Nusa Dua, Bali."
        width={1254}
        height={1254}
        priority
      />
    </div>
  );
}

function TravelDetails() {
  return (
    <section id="travel" className="infoSection">
      <div className="infoArt">
        <Image
          src="/images/wallart.png"
          alt=""
          fill
          sizes="(max-width: 800px) 100vw, 50vw"
        />
      </div>
      <div className="infoCopy">
        <div className="infoTitle">
          <p className="infoThe">The</p>
          <h2>Details</h2>
        </div>
        <article className="infoBlock">
          <h3>Airfare</h3>
          <p>
            Guests are kindly asked to book their own flights to Ngurah Rai International Airport. We recognize this is a long way to travel and we don’t take it lightly. Please don’t hesitate to reach out if you have questions, need help with logistics, or hit a snag along the way.
          </p>
        </article>
        <hr className="infoRule" />
        <article className="infoBlock">
          <h3>International travel</h3>
          <p>
            Foreign travelers can apply for a visa on arrival through the{" "}
            <a href="https://evisa.imigrasi.go.id/" target="_blank" rel="noopener noreferrer">
              official immigration site
            </a>{" "}
            of Indonesia for a visa that will be valid for 30 days.
          </p>
          <p>
            International travelers can also get an e-sim on arrival at one of the phone kiosks at the Bali Airport.
          </p>
        </article>
      </div>
    </section>
  );
}

function Stay({ scheduleType, hotelType, familySize }: {
  scheduleType: ScheduleType;
  hotelType: HotelType;
  familySize: number | null;
}) {
  const hotel = wedding.accommodations.hotels[hotelType];
  const nights = wedding.accommodations.nights[scheduleType];
  const atRenaissance = hotelType === "renaissance";

  return (
    <section id="stay" className="staySection">
      <div className="stayBrand">
        <p className="stayYour">Your</p>
        <h2>Stay</h2>
        <div className="stayIcon">
          <Image src="/images/sketch.png" alt="" width={1024} height={1536} />
        </div>
      </div>
      <div className="stayCopy">
        <p className="stayHotel">{hotel.name}</p>
        <p className="stayDates">{nights}</p>
        <p className="stayDetail">
          We’ve reserved {familySize !== null ? "you and your family rooms" : "you a room"} at {atRenaissance ? "the " : ""}{hotel.name} for {nights.replace(", 2027", "")}, with breakfast included. Please let us know on your RSVP if you would like to stay with us.
        </p>
        {atRenaissance ? (
          <p className="stayNote">
            The wedding itself is at The St. Regis, and transportation will be provided to and from the venue on the wedding day. The estimated travel time between Renaissance &amp; St. Regis is 5 minutes.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Schedule({ scheduleType }: { scheduleType: ScheduleType }) {
  const schedule = wedding.schedules[scheduleType];
  const friday = schedule.events.find((event) => event.id === "welcome");
  const saturday = schedule.events.filter((event) => event.dateLabel.startsWith("Saturday"));
  const days = [
    friday ? {
      id: "friday",
      date: friday.time ? `Friday, August 13th · ${friday.time}` : "Friday, August 13th",
      title: "The Welcome Dinner",
      icon: friday.icon,
      dressCode: friday.dressCode,
      events: [{ ...friday, time: undefined }],
    } : null,
    {
      id: "saturday",
      date: "Saturday, August 14th",
      title: "The Wedding Day",
      icon: "/images/wedding-icon.png",
      dressCode: saturday.find((event) => event.dressCode)?.dressCode,
      events: saturday,
    },
  ].filter((day) => day !== null);

  return (
    <section id="schedule" className="scheduleSection sectionPad">
      <div className="scheduleTitle">
        <p className="scheduleThe">The</p>
        <h2>Wedding<br />Weekend</h2>
      </div>
      <div className={`weekendBoard weekendBoard-${days.length}`}>
        {days.map((day) => (
          <article className={`weekendDay weekendDay-${day.id}`} key={day.id}>
            {day.icon ? (
              <div className="weekendIcon">
                <Image src={day.icon} alt="" width={280} height={280} />
              </div>
            ) : null}
            <h3>{day.title}</h3>
            <p className="weekendDate">{day.date}</p>
            {day.dressCode ? <p className="weekendDress">Dress code: {day.dressCode}</p> : null}
            <div className="weekendEvents">
              {day.events.map((event) => (
                <div className="weekendEvent" key={event.id}>
                  {day.events.length > 1 ? <p className="weekendEventTitle">{event.title}</p> : null}
                  {event.venue ? <p className="weekendMeta">{event.venue}</p> : null}
                  {event.detail ? <p className="weekendMeta">{event.detail}</p> : null}
                  {event.time ? <p className="weekendMeta">{event.time}</p> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RsvpForm({ guest }: { guest: PublicGuest }) {
  const [attending, setAttending] = useState("");
  const [plusOne, setPlusOne] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [familyCount, setFamilyCount] = useState(0);
  const [family, setFamily] = useState<FamilyMember[]>(() =>
    Array.from({ length: guest.familySize ?? 0 }, (_, index) => ({
      name: index === 0 ? guest.name : "",
      dinner: true,
      wedding: true,
    })),
  );
  const [accommodation, setAccommodation] = useState("");
  const [staying, setStaying] = useState(0);
  const hasPlusOne = guest.plusOneAllowed;
  const isFamily = guest.familySize !== null;
  const isExtended = guest.scheduleType === "extended";
  const joiningFamily = family.slice(0, familyCount);
  const stayingCount = staying === 0 ? familyCount : Math.min(staying, familyCount);
  const wantsRoom = accommodation !== "" && accommodation !== "no";
  const stayHotel = wedding.accommodations.hotels[guest.hotelType];
  const stayOffer = isFamily ? "rooms for you and your family" : "a room for you";
  const hotelPrefix = guest.hotelType === "renaissance" ? "the " : "";

  function updateFamilyMember(index: number, changes: Partial<FamilyMember>) {
    setFamily((current) => current.map((member, i) => (i === index ? { ...member, ...changes } : member)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (attending === "yes" && isExtended && joiningFamily.some((member) => !member.dinner && !member.wedding)) {
      setStatus("error");
      setMessage("Please choose at least one event for each guest.");
      return;
    }
    setStatus("saving");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(data.entries()), familyMembers: joiningFamily };
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await response.text();
      let result: { error?: string; destination?: string } = {};
      if (raw) {
        try {
          result = JSON.parse(raw) as { error?: string; destination?: string };
        } catch {
          throw new Error("We couldn't save your RSVP. Please try again.");
        }
      }
      if (!response.ok) {
        throw new Error(
          result.error ||
            (raw
              ? "We couldn't save your RSVP."
              : `We couldn't save your RSVP (server returned ${response.status} with an empty response). Check Vercel logs for /api/rsvp.`),
        );
      }
      if (!raw) throw new Error("We couldn't save your RSVP. Empty server response.");
      setStatus("success");
      setMessage(result.destination === "local-json" ? "Saved locally for testing." : "Your RSVP has been received.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We couldn't save your RSVP.");
    }
  }

  return (
    <>
      {status === "success" ? (
        <div className="rsvpSuccess" role="status">
          <div className="successMonogram">S <span>&amp;</span> C</div>
          <h3>Thank you, {guest.name}.</h3>
          <p>{message}</p>
          <button type="button" className="textButton" onClick={() => setStatus("idle")}>Update response</button>
        </div>
      ) : null}
      {/* Stays mounted while hidden so "Update response" keeps the guest's answers. */}
      <form className="rsvpForm" onSubmit={submit} hidden={status === "success"}>
        <div className="formIntro">
          <h2>RSVP</h2>
          <p className="formLead">Make our day special</p>
          <p>We would be delighted to celebrate with you, {guest.name}.</p>
        </div>

        <fieldset>
          <legend>Will you be joining us?</legend>
          <div className="choiceGrid two">
            <label className={attending === "yes" ? "selected" : ""}>
              <input required type="radio" name="attending" value="yes" onChange={() => setAttending("yes")} />
              Joyfully accepts
            </label>
            <label className={attending === "no" ? "selected" : ""}>
              <input required type="radio" name="attending" value="no" onChange={() => { setAttending("no"); setPlusOne(""); }} />
              Regretfully declines
            </label>
          </div>
        </fieldset>

        {attending === "yes" ? (
          <div className="rsvpDetails">
            <label className="fieldLabel">
              Who should we address the invitations to?
              <input name="invitationName" required defaultValue={guest.name} autoComplete="name" />
            </label>

            <div className="fieldRow">
              <label className="fieldLabel">
                Email
                <input type="email" name="email" required autoComplete="email" />
              </label>
              <label className="fieldLabel">
                WhatsApp
                <input type="tel" name="whatsapp" required autoComplete="tel" placeholder="+62 …" />
              </label>
            </div>

            {hasPlusOne ? (
              <>
                <fieldset>
                  <legend>Will you be bringing a plus one?</legend>
                  <div className="choiceGrid two compact">
                    <label>
                      <input required type="radio" name="plusOne" value="yes" onChange={() => setPlusOne("yes")} />
                      Yes
                    </label>
                    <label>
                      <input required type="radio" name="plusOne" value="no" onChange={() => setPlusOne("no")} />
                      No
                    </label>
                  </div>
                </fieldset>
                {plusOne === "yes" ? (
                  <label className="fieldLabel">
                    Name of your plus one
                    <input name="plusOneName" required autoComplete="name" placeholder="Full name" />
                  </label>
                ) : null}
              </>
            ) : null}

            {isFamily ? (
              <fieldset>
                <legend>Your family</legend>
                <p className="fieldHint">
                  Your invitation includes your family of {guest.familySize}. How many of you will be joining us?
                </p>
                <div className="choiceGrid familyCount compact">
                  {Array.from({ length: guest.familySize ?? 0 }, (_, index) => index + 1).map((count) => (
                    <label key={count}>
                      <input
                        required
                        type="radio"
                        name="familyCount"
                        value={count}
                        checked={familyCount === count}
                        onChange={() => setFamilyCount(count)}
                      />
                      {count}
                    </label>
                  ))}
                </div>
                {familyCount > 0 ? (
                  <div className="familyMembers">
                    <p className="fieldHint">
                      {isExtended
                        ? "Please add each person’s name and the events they will join."
                        : "Please add the name of each person joining us for the wedding."}
                    </p>
                    {joiningFamily.map((member, index) => (
                      <div className="familyMember" key={index}>
                        <label className="fieldLabel">
                          Guest {index + 1}
                          <input
                            required
                            autoComplete="off"
                            placeholder="Full name"
                            value={member.name}
                            onChange={(event) => updateFamilyMember(index, { name: event.target.value })}
                          />
                        </label>
                        {isExtended ? (
                          <div className="choiceGrid familyEvents compact">
                            <label>
                              <input
                                type="checkbox"
                                checked={member.dinner}
                                onChange={(event) => updateFamilyMember(index, { dinner: event.target.checked })}
                              />
                              Welcome Dinner
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={member.wedding}
                                onChange={(event) => updateFamilyMember(index, { wedding: event.target.checked })}
                              />
                              Wedding
                            </label>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </fieldset>
            ) : null}

            {!isFamily || familyCount > 0 ? (
              <fieldset>
                <legend>Stay at {stayHotel.shortName}</legend>
                <p className="fieldHint">
                  We’d be happy to provide {stayOffer} at {hotelPrefix}{stayHotel.name}. Please let us know your preference.
                </p>
                <div className={isExtended ? "choiceGrid compact" : "choiceGrid two compact"}>
                  {(isExtended
                    ? [
                        { value: "two-nights", label: "Two nights (August 13–15)" },
                        { value: "one-night", label: "One night (August 14–15)" },
                        { value: "no", label: isFamily ? "No, we’ll arrange our own stay" : "No, I’ll arrange my own stay" },
                      ]
                    : [
                        { value: "yes", label: "Yes, please (August 14–15)" },
                        { value: "no", label: "No, thank you" },
                      ]
                  ).map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="accommodation"
                        value={option.value}
                        required
                        checked={accommodation === option.value}
                        onChange={() => setAccommodation(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {isFamily && wantsRoom && familyCount > 1 ? (
                  <div className="familyMembers">
                    <p className="fieldHint">How many of your family will be staying?</p>
                    <div className="choiceGrid familyCount compact">
                      {Array.from({ length: familyCount }, (_, index) => index + 1).map((count) => (
                        <label key={count}>
                          <input
                            required
                            type="radio"
                            name="stayingCount"
                            value={count}
                            checked={stayingCount === count}
                            onChange={() => setStaying(count)}
                          />
                          {count}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </fieldset>
            ) : null}

            {guest.scheduleType === "extended" && !isFamily ? (
              <fieldset>
                <legend>Welcome dinner · Friday</legend>
                <div className="choiceGrid two compact">
                  <label><input type="radio" name="welcomeDinner" value="yes" required />Attending</label>
                  <label><input type="radio" name="welcomeDinner" value="no" required />Unable to attend</label>
                </div>
              </fieldset>
            ) : null}

            {!isFamily ? (
              <fieldset>
                <legend>Wedding day · Saturday</legend>
                <div className="choiceGrid two compact">
                  <label><input type="radio" name="weddingDay" value="yes" required />Attending</label>
                  <label><input type="radio" name="weddingDay" value="no" required />Unable to attend</label>
                </div>
              </fieldset>
            ) : null}

            <label className="fieldLabel">
              Dietary restrictions
              <textarea name="dietaryRestrictions" rows={3} placeholder="Please let us know of any allergies or dietary needs." />
            </label>
          </div>
        ) : null}

        <label className="fieldLabel">
          Additional Notes / Requests / Questions <span className="optional">optional</span>
          <textarea name="message" rows={4} placeholder="Leave a note…" />
        </label>

        {status === "error" ? <p className="formError" role="alert">{message}</p> : null}
        <button className="submitRsvp" type="submit" disabled={status === "saving" || !attending}>
          {status === "saving" ? "Sending…" : "Send RSVP"}
        </button>
      </form>
    </>
  );
}

function WeddingSite({ guest, musicPlaying, musicAvailable, toggleMusic }: {
  guest: PublicGuest;
  musicPlaying: boolean;
  musicAvailable: boolean;
  toggleMusic: () => void;
}) {
  return (
    <main className="siteRoot">
      <header className="siteHeader">
        <p className="siteNames">Sebastian and Charlize</p>
        <nav className="siteNav" aria-label="Wedding navigation">
          <a href="#details" onClick={(event) => scrollToSection(event, "details")}>Details</a>
          <a href="#schedule" onClick={(event) => scrollToSection(event, "schedule")}>Schedule</a>
          <a href="#stay" onClick={(event) => scrollToSection(event, "stay")}>Stay</a>
          <a href="#rsvp" onClick={(event) => scrollToSection(event, "rsvp")}>RSVP</a>
        </nav>
        {musicAvailable ? (
          <button className="musicToggle" type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Mute music" : "Play music"}>
            <span className={musicPlaying ? "musicBars active" : "musicBars"}><i /><i /><i /></span>
            <span className="musicText">{musicPlaying ? "Music on" : "Music off"}</span>
          </button>
        ) : null}
      </header>

      <section className="videoHero">
        <video autoPlay muted loop playsInline poster="/images/water-poster.jpg" aria-hidden="true">
          <source src="/video/water-hero.mp4" type="video/mp4" />
        </video>
        <div className="heroShade" />
        <div className="heroContent">
          <SaveTheDateDoily />
        </div>
        <a className="scrollCue" href="#details" aria-label="Scroll to wedding details" onClick={(event) => scrollToSection(event, "details")}><span>Scroll</span><i /></a>
      </section>

      <section id="details" className="welcomeSection sectionPad">
        <div className="introPortrait">
          <Image
            src="/images/Couple Photo 1.png"
            alt="Sebastian and Charlize sitting together"
            width={1254}
            height={1254}
            sizes="(max-width: 800px) 86vw, 420px"
          />
        </div>
        <div className="welcomeCopy">
          <p className="detailsBody">
            Life’s greatest joys are made richer by the people we hold dear. On August 14th, 2027 we’ll marry in Bali, surrounded by the people and the culture that shaped us. We would be honored to have you there — and fully expect you to eat too much, dance too long, and cry a little.
          </p>
          <p className="detailsLove">with love,</p>
          <p className="detailsSignoff">Sebastian and Charlize</p>
        </div>
      </section>

      <Schedule scheduleType={guest.scheduleType} />
      <TravelDetails />
      <Stay scheduleType={guest.scheduleType} hotelType={guest.hotelType} familySize={guest.familySize} />

      <section id="rsvp" className="rsvpSection sectionPad">
        <RsvpForm guest={guest} />
      </section>

      <section id="contact" className="contactSection">
        <div className="contactCopy">
          <div className="contactTitle">
            <p className="contactSee">see you in</p>
            <h2>Bali</h2>
          </div>
          <p className="contactNote">
            Please don’t hesitate to contact us below if you have any questions or concerns. WhatsApp is best — please text rather than call.
          </p>
          <p className="contactEmail">
            Email:{" "}
            <a href="mailto:sebastiancharlize1@gmail.com">sebastiancharlize1@gmail.com</a>
          </p>
          <div className="contactPeople">
            <div className="contactPerson">
              <p className="contactName">Sebastian Suherman</p>
              <p>
                WhatsApp:{" "}
                <a href="https://wa.me/628111184845" target="_blank" rel="noopener noreferrer">
                  +62 811-1184-845
                </a>
              </p>
            </div>
            <div className="contactPerson">
              <p className="contactName">Charlize Sentosa</p>
              <p>
                WhatsApp:{" "}
                <a href="https://wa.me/14012594744" target="_blank" rel="noopener noreferrer">
                  +1 401-259-4744
                </a>
              </p>
            </div>
          </div>
          <div className="contactLogo">
            <Image
              src="/images/SC%20Logo.png"
              alt="Sebastian and Charlize"
              width={800}
              height={1000}
            />
          </div>
        </div>
        <div className="contactPhoto">
          <Image
            src="/images/couple-1.webp"
            alt="Sebastian and Charlize"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
      </section>
    </main>
  );
}

export default function WeddingExperience() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reduceMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("No session");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const current = data.guest as PublicGuest;
        setGuest(current);
        const opened = window.sessionStorage.getItem("cs-wedding-opened") === "1";
        setPhase(opened ? "site" : "envelope");
      })
      .catch(() => active && setPhase("login"));
    return () => { active = false; };
  }, []);

  async function startMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = false;
    audio.volume = 0.7;
    try {
      await audio.play();
      setMusicPlaying(true);
      setMusicAvailable(true);
    } catch {
      setMusicAvailable(false);
      setMusicPlaying(false);
    }
  }

  function ensureAudio() {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(MUSIC_SRC);
    audio.preload = "auto";
    audio.loop = false;
    audio.addEventListener("ended", () => setMusicPlaying(false));
    audioRef.current = audio;
    return audio;
  }

  /** Must run synchronously inside a click/tap handler (before any await). */
  function unlockMusicFromGesture() {
    ensureAudio();
    void startMusic();
  }

  function stopMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setMusicPlaying(false);
  }

  function onLogin(current: PublicGuest) {
    setGuest(current);
    setPhase("envelope");
  }

  function openEnvelope() {
    if (!guest || phase === "opening") return;
    setPhase("opening");

    window.setTimeout(() => {
      window.sessionStorage.setItem("cs-wedding-opened", "1");
      setPhase("site");
    }, reduceMotion ? 250 : 2300);
  }

  async function toggleMusic() {
    const audio = ensureAudio();
    if (audio.paused) {
      await startMusic();
      return;
    }
    audio.pause();
    setMusicPlaying(false);
  }

  if (phase === "checking") return <div className="loadingScreen"><span>SS · CS</span></div>;
  if (phase === "login") {
    return <Login onLogin={onLogin} onUnlockMusic={unlockMusicFromGesture} onStopMusic={stopMusic} />;
  }
  if (!guest) {
    return <Login onLogin={onLogin} onUnlockMusic={unlockMusicFromGesture} onStopMusic={stopMusic} />;
  }
  if (phase === "envelope" || phase === "opening") return <Envelope guest={guest} opening={phase === "opening"} onOpen={openEnvelope} />;

  return (
    <WeddingSite
      guest={guest}
      musicPlaying={musicPlaying}
      musicAvailable={musicAvailable}
      toggleMusic={toggleMusic}
    />
  );
}
