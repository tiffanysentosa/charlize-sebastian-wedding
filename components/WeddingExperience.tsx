"use client";

import Image from "next/image";
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { wedding, type ScheduleType } from "@/lib/wedding";

type PublicGuest = {
  id: string;
  name: string;
  scheduleType: ScheduleType;
};

type Phase = "checking" | "login" | "envelope" | "opening" | "site";

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

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

function getCountdown(): Countdown | null {
  const target = new Date(wedding.ceremonyIso).getTime();
  const distance = target - Date.now();
  if (distance <= 0) return null;
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function Login({ onLogin }: { onLogin: (guest: PublicGuest) => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to open invitation.");
      onLogin(data.guest as PublicGuest);
    } catch (err) {
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
          src="/images/ivory-embossed-card.png"
          alt=""
          fill
          priority
          sizes="(max-width: 800px) 96vw, 760px"
          className="loginCardArt"
        />
        <div className="loginCardInner">
          <p className="loginEyebrow">a private invitation</p>
          <p className="loginFrom">from</p>
          <h1>Charlize and Sebastian</h1>
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
        <h1><span>Charlize</span><i>&amp;</i><span>Sebastian</span></h1>
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
        src="/images/lace-doily-charlize-and-sebastian.png"
        alt="We are getting married. Charlize Sentosa and Sebastian Suherman. Save the date, August 14, 2027, Nusa Dua, Bali."
        width={1254}
        height={1254}
        priority
      />
    </div>
  );
}

function CountdownBlock() {
  const [countdown, setCountdown] = useState<Countdown | null>(() => getCountdown());
  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!countdown) return <p className="weddingWeekend">It’s wedding weekend.</p>;

  const items = [
    [countdown.days, "Days"],
    [countdown.hours, "Hours"],
    [countdown.minutes, "Minutes"],
    [countdown.seconds, "Seconds"],
  ] as const;

  return (
    <div className="countdown" aria-label="Countdown to the ceremony">
      {items.map(([value, label]) => (
        <div key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Stay({ scheduleType }: { scheduleType: ScheduleType }) {
  const stay = wedding.accommodations[scheduleType];
  return (
    <section id="stay" className="staySection">
      <Image
        src="/images/log-in-background.png"
        alt=""
        fill
        sizes="100vw"
        className="stayBackdrop"
      />
      <div className="stayCard">
        <p className="kicker">Your stay</p>
        <h2>{wedding.accommodations.hotel}</h2>
        <p className="stayDates">{stay.nights}</p>
        <div className="stayRule" />
        <p>{stay.detail}</p>
        <p className="stayNote">The wedding itself is at The St. Regis Bali Resort, just nearby in Nusa Dua.</p>
      </div>
    </section>
  );
}

function Schedule({ scheduleType }: { scheduleType: ScheduleType }) {
  const schedule = wedding.schedules[scheduleType];
  return (
    <section id="schedule" className="scheduleSection sectionPad">
      <div className="sectionTitleRow">
        <h2>Order of events</h2>
        <p>{schedule.dateRange}</p>
      </div>
      <div className={`eventsBoard eventsBoard-${schedule.events.length}`}>
        {schedule.events.map((event) => (
          <article className="eventColumn" key={event.id}>
            <div className="eventIcon">
              <Image src={event.icon} alt="" width={280} height={280} />
            </div>
            <h3>{event.title}</h3>
            <p className="eventVenue">{event.venue}</p>
            {event.detail ? <p className="eventDetail">{event.detail}</p> : null}
            <p className="eventWhen">{event.dateLabel}{event.time ? ` · ${event.time}` : ""}</p>
            {event.dressCode ? <p className="eventDress">{event.dressCode}</p> : null}
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
  const hasPlusOne = guest.scheduleType === "extended";
  const partySize = hasPlusOne && plusOne === "yes" ? "2" : "1";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't save your RSVP.");
      setStatus("success");
      setMessage(result.destination === "local-json" ? "Saved locally for testing." : "Your RSVP has been received.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We couldn't save your RSVP.");
    }
  }

  if (status === "success") {
    return (
      <div className="rsvpSuccess" role="status">
        <div className="successMonogram">C <span>&amp;</span> S</div>
        <h3>Thank you, {guest.name}.</h3>
        <p>{message}</p>
        <button type="button" className="textButton" onClick={() => setStatus("idle")}>Update response</button>
      </div>
    );
  }

  return (
    <form className="rsvpForm" onSubmit={submit}>
      <div className="formIntro">
        <p className="kicker">Kindly reply</p>
        <h2>RSVP</h2>
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
          ) : (
            <input type="hidden" name="plusOne" value="not-allotted" />
          )}
          <input type="hidden" name="partySize" value={partySize} />

          {guest.scheduleType === "extended" ? (
            <fieldset>
              <legend>Stay at the Renaissance</legend>
              <p className="fieldHint">We’d love to host you at the Renaissance Bali. Would you like a room for one or two nights (August 13–15)?</p>
              <div className="choiceGrid compact">
                <label><input type="radio" name="accommodation" value="two-nights" required />Two nights (August 13–15)</label>
                <label><input type="radio" name="accommodation" value="one-night" required />One night</label>
                <label><input type="radio" name="accommodation" value="no" required />No, I’ll arrange my own stay</label>
              </div>
            </fieldset>
          ) : (
            <fieldset>
              <legend>Stay at the Renaissance</legend>
              <p className="fieldHint">We’ve reserved a room for you at the Renaissance Bali for the night of August 14. Would you like to stay with us?</p>
              <div className="choiceGrid two compact">
                <label><input type="radio" name="accommodation" value="yes" required />Yes, please</label>
                <label><input type="radio" name="accommodation" value="no" required />No, thank you</label>
              </div>
            </fieldset>
          )}

          {guest.scheduleType === "extended" ? (
            <fieldset>
              <legend>Welcome dinner · Friday</legend>
              <div className="choiceGrid two compact">
                <label><input type="radio" name="welcomeDinner" value="yes" required />Attending</label>
                <label><input type="radio" name="welcomeDinner" value="no" required />Unable to attend</label>
              </div>
            </fieldset>
          ) : null}

          <fieldset>
            <legend>Wedding day · Saturday</legend>
            <div className="choiceGrid two compact">
              <label><input type="radio" name="weddingDay" value="yes" required />Attending</label>
              <label><input type="radio" name="weddingDay" value="no" required />Unable to attend</label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Brunch · Sunday</legend>
            <div className="choiceGrid two compact">
              <label><input type="radio" name="brunch" value="yes" required />Attending</label>
              <label><input type="radio" name="brunch" value="no" required />Unable to attend</label>
            </div>
          </fieldset>

          <label className="fieldLabel">
            Dietary restrictions
            <textarea name="dietaryRestrictions" rows={3} placeholder="Please let us know of any allergies or dietary needs." />
          </label>
        </div>
      ) : null}

      <label className="fieldLabel">
        A note for the couple <span className="optional">optional</span>
        <textarea name="message" rows={4} placeholder="Leave a message…" />
      </label>

      {status === "error" ? <p className="formError" role="alert">{message}</p> : null}
      <button className="submitRsvp" type="submit" disabled={status === "saving" || !attending}>
        {status === "saving" ? "Sending…" : "Send RSVP"}
      </button>
    </form>
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
        <p className="siteNames">Charlize and Sebastian</p>
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
        <div className="welcomeCopy">
          <Image
            src="/images/CS-logo.png"
            alt=""
            width={1254}
            height={1254}
            className="detailsLogo"
          />
          <p className="detailsEyebrow">
            St. Regis Bali | {guest.scheduleType === "extended" ? "August 13th – 15th" : "August 14th – 15th"}
          </p>
          <p className="detailsBody">
            We can’t wait to celebrate with you in Bali. Join us for a weekend by the sea at The St. Regis Bali Resort in Nusa Dua. Ceremony on the beach, followed by cocktails, dinner and dancing.
          </p>
          <p className="detailsLove">with love,</p>
          <p className="detailsSignoff">Charlize and Sebastian</p>
        </div>
        <div className="framedPortrait">
          <Image
            src="/images/Couple Photo 1.png"
            alt="Charlize and Sebastian sitting together"
            width={1254}
            height={1254}
            sizes="(max-width: 800px) 92vw, 48vw"
          />
        </div>
      </section>

      <section className="countdownSection">
        <p className="kicker">Forever starts in</p>
        <CountdownBlock />
      </section>

      <Schedule scheduleType={guest.scheduleType} />
      <Stay scheduleType={guest.scheduleType} />

      <section className="photoBreak">
        <Image src="/images/couple-1.webp" alt="Charlize and Sebastian embracing in a garden" fill sizes="100vw" />
        <div className="photoBreakOverlay">
          <p>See you in Bali</p>
          <span>C · S</span>
        </div>
      </section>

      <section id="rsvp" className="rsvpSection sectionPad">
        <RsvpForm guest={guest} />
      </section>

      <footer className="siteFooter">
        <p>Charlize Sentosa &amp; Sebastian Suherman</p>
        <p>Nusa Dua, Bali · August 2027</p>
      </footer>
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
    audio.volume = 0;
    try {
      await audio.play();
      setMusicPlaying(true);
      const target = 0.42;
      const step = 0.035;
      const timer = window.setInterval(() => {
        if (!audioRef.current) return window.clearInterval(timer);
        const next = Math.min(target, audioRef.current.volume + step);
        audioRef.current.volume = next;
        if (next >= target) window.clearInterval(timer);
      }, 80);
    } catch {
      setMusicAvailable(false);
      setMusicPlaying(false);
    }
  }

  function onLogin(current: PublicGuest) {
    setGuest(current);
    setPhase("envelope");
  }

  function openEnvelope() {
    if (!guest || phase === "opening") return;
    setPhase("opening");

    // Create the audio element synchronously within the tap gesture, then play.
    if (!audioRef.current) {
      const audio = new Audio("/audio/carnival-of-the-animals.mp3");
      audio.preload = "auto";
      audioRef.current = audio;
    }
    void startMusic();

    window.setTimeout(() => {
      window.sessionStorage.setItem("cs-wedding-opened", "1");
      setPhase("site");
    }, reduceMotion ? 250 : 2300);
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) {
      const created = new Audio("/audio/carnival-of-the-animals.mp3");
      created.preload = "auto";
      audioRef.current = created;
      await startMusic();
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
        setMusicPlaying(true);
      } catch {
        setMusicAvailable(false);
      }
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }

  if (phase === "checking") return <div className="loadingScreen"><span>CS · SS</span></div>;
  if (phase === "login") return <Login onLogin={onLogin} />;
  if (!guest) return <Login onLogin={onLogin} />;
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
