export type ScheduleType = "standard" | "extended";
export type HotelType = "renaissance" | "st-regis";

export type WeddingEvent = {
  id: string;
  dateLabel: string;
  time?: string;
  title: string;
  venue: string;
  detail?: string;
  dressCode?: string;
  icon?: string;
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
    location: string;
    weddingVenue: string;
    nights: Record<ScheduleType, string>;
    hotels: Record<HotelType, {
      name: string;
      shortName: string;
    }>;
  };
  schedules: Record<ScheduleType, WeddingSchedule>;
};

export const wedding: WeddingConfig = {
  couple: {
    firstNames: "Sebastian & Charlize",
    fullNames: "Sebastian Suherman & Charlize Sentosa",
    monogram: "SS · CS",
  },
  year: 2027,
  location: "Nusa Dua, Bali",
  venue: "The St. Regis Bali Resort",
  ceremonyIso: "2027-08-14T16:00:00+08:00",
  accommodations: {
    location: "Nusa Dua, Bali",
    weddingVenue: "The St. Regis Bali Resort",
    nights: {
      standard: "August 14–15, 2027",
      extended: "August 13–15, 2027",
    },
    hotels: {
      renaissance: {
        name: "Renaissance Bali Resort & Spa Nusa Dua",
        shortName: "Renaissance Bali",
      },
      "st-regis": {
        name: "The St. Regis Bali Resort Nusa Dua",
        shortName: "St. Regis Bali",
      },
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
        },
        {
          id: "cocktails",
          dateLabel: "Saturday, August 14",
          time: "5:00 PM",
          title: "Cocktail Hour",
          venue: "St. Regis Cloud Nine",
        },
        {
          id: "dinner",
          dateLabel: "Saturday, August 14",
          time: "7:00 PM",
          title: "Dinner",
          venue: "St. Regis Cloud Nine",
        },
        {
          id: "afterparty",
          dateLabel: "Saturday, August 14",
          time: "9:30 PM",
          title: "After Party",
          venue: "St. Regis Astor Ballroom",
        },
        {
          id: "brunch",
          dateLabel: "Sunday, August 15",
          time: "11:00 AM",
          title: "D+1 Brunch",
          venue: "Renaissance Breakfast",
          dressCode: "Casual",
          icon: "/images/icon2.png",
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
          dressCode: "Cocktail Attire",
          icon: "/images/icon1.png",
        },
        {
          id: "ceremony",
          dateLabel: "Saturday, August 14",
          time: "4:00 PM",
          title: "Holy Matrimony",
          venue: "St. Regis Beach",
          dressCode: "Black Tie",
        },
        {
          id: "cocktails",
          dateLabel: "Saturday, August 14",
          time: "5:00 PM",
          title: "Cocktail Hour",
          venue: "St. Regis Cloud Nine",
        },
        {
          id: "dinner",
          dateLabel: "Saturday, August 14",
          time: "7:00 PM",
          title: "Dinner",
          venue: "St. Regis Cloud Nine",
        },
        {
          id: "afterparty",
          dateLabel: "Saturday, August 14",
          time: "9:30 PM",
          title: "After Party",
          venue: "St. Regis Astor Ballroom",
        },
        {
          id: "brunch",
          dateLabel: "Sunday, August 15",
          time: "11:00 AM",
          title: "D+1 Brunch",
          venue: "Renaissance Breakfast",
          dressCode: "Casual",
          icon: "/images/icon2.png",
        },
      ],
    },
  },
};
