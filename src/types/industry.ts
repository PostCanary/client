export interface IndustryHeroContent {
  headline: string;
  subheadline: string;
  steps?: {
    step1: string;
    step2: string;
    step3: string;
  };
}

export interface PainPointCard {
  icon: string;
  iconAlt: string;
  title: string;
  body: string;
}

export interface IndustryPainPointsContent {
  heading: string;
  subheading: string;
  cards: PainPointCard[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface IndustryFAQContent {
  heading?: string;
  faqs: FAQItem[];
}

export interface Testimonial {
  quote: string;
  author: string;
  company: string;
  role?: string;
  avatar?: string;
  metric?: string;
}

export interface IndustryTestimonialsContent {
  heading: string;
  subheading?: string;
  testimonials: Testimonial[];
}
