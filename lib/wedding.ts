export type ScheduleType = "standard" | "extended";

export type WeddingEvent = {
  id: string;
  dateLabel: string;
  time?: string;
  title: string;
  venue: string;
  detail?: string;
  dressCode?: string;
  icon: string;
};

type WeddingSchedule = {
  dateRange: string;
  eyebrow: string;
  events: WeddingEvent[];
};

type WeddingConfig = {
  couple: {
    firstNames: string;
    fullNames: string;
    monogram: string;
  };
  year: number;
  location: string;
  venue: string;
  ceremonyIso: string;
  accommodations: {
    hotel: string;
    location: string;
    standard: { nights: string; detail: string };
    extended: { nights: string; detail: string };
  };
  schedules: Record<ScheduleType, WeddingSchedule>;
};

export const wedding: WeddingConfig = {
  couple: {
    firstNames: "Charlize & Sebastian",
    fullNames: "Charlize Sentosa & Sebastian Suherman",
    monogram: "CS · SS",
  },
  year: 2027,
  location: "Nusa Dua, Bali",
  venue: "The St. Regis Bali Resort",
  ceremonyIso: "2027-08-14T16:00:00+08:00",
  accommodations: {
    hotel: "Renaissance Bali",
    location: "Nusa Dua, Bali",
    standard: {
      nights: "August 14–15, 2027",
      detail: "We’ve arranged your stay at the Renaissance Bali from August 14 to 15.",
    },
    extended: {
      nights: "August 13–15, 2027",
      detail: "We’ve arranged your stay at the Renaissance Bali from August 13 to 15.",
    },
  },
  schedules: {
    standard: {
      dateRange: "August 14–15, 2027",
      eyebrow: "Wedding Weekend",
      events: [
        {
          id: "ceremony",
          dateLabel: "Saturday, August 14",
          time: "4:00 PM",
          title: "Holy Matrimony",
          venue: "St. Regis Beach",
          dressCode: "Black Tie",
          icon: "/images/holy-matrimony.png",
        },
        {
          id: "dinner",
          dateLabel: "Saturday, August 14",
          time: "5:00 PM",
          title: "Cocktails + Dinner",
          venue: "St. Regis Cloud Nine",
          icon: "/images/cocktails-dinner.png",
        },
        {
          id: "afterparty",
          dateLabel: "Saturday, August 14",
          time: "9:30 PM",
          title: "After Party",
          venue: "St. Regis Astor Ballroom",
          icon: "/images/after-party-icon.png",
        },
        {
          id: "brunch",
          dateLabel: "Sunday, August 15",
          time: "11:00 AM",
          title: "D+1 Brunch",
          venue: "Renaissance Breakfast",
          dressCode: "Casual Attire",
          icon: "/images/brunch.png",
        },
      ],
    },
    extended: {
      dateRange: "August 13–15, 2027",
      eyebrow: "Wedding Weekend",
      events: [
        {
          id: "welcome",
          dateLabel: "Friday, August 13",
          title: "Welcome Dinner",
          venue: "Renaissance Nusa Dua",
          detail: "Restaurant name to be confirmed",
          dressCode: "Cocktail Attire",
          icon: "/images/welcome-dinner-2.png",
        },
        {
          id: "ceremony",
          dateLabel: "Saturday, August 14",
          time: "4:00 PM",
          title: "Holy Matrimony",
          venue: "St. Regis Beach",
          dressCode: "Black Tie",
          icon: "/images/holy-matrimony.png",
        },
        {
          id: "dinner",
          dateLabel: "Saturday, August 14",
          time: "5:00 PM",
          title: "Cocktails + Dinner",
          venue: "St. Regis Cloud Nine",
          icon: "/images/cocktails-dinner.png",
        },
        {
          id: "afterparty",
          dateLabel: "Saturday, August 14",
          time: "9:30 PM",
          title: "After Party",
          venue: "St. Regis Astor Ballroom",
          icon: "/images/after-party-icon.png",
        },
        {
          id: "brunch",
          dateLabel: "Sunday, August 15",
          time: "11:00 AM",
          title: "D+1 Brunch",
          venue: "Renaissance Breakfast",
          dressCode: "Casual Attire",
          icon: "/images/brunch.png",
        },
      ],
    },
  },
};
