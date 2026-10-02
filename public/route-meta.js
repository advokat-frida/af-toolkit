// Shared by initial HTML and client navigation. Keep one description per route.
export const ORIGIN = "https://toolkit.advokatfrida.com";

export const TOOLS = {
  safeseed: {
    title: "SafeSeed",
    description: "Generate fake personal information and generate a tamper-evident receipt.",
    artifact: "/tools/safeseed"
  },
  safelist: {
    title: "SafeList",
    description: "Remove opted-out contacts from a send list and keep a record of the check.",
    artifact: "/tools/safelist"
  },
  redactorium: {
    title: "Redactorium",
    description: "Anonymize a spreadsheet or document: find the personal data, then remove or replace it.",
    artifact: "/tools/redactorium/"
  },
  "privacy-wizards": {
    title: "Privacy Wizards Council",
    description: "Get quick and citable answers for commonly recurring privacy questions.",
    artifact: "/tools/privacy-wizards-council"
  }
};

export const HOME = {
  title: "Home",
  description: "The Advokat Frida Toolkit: four practical privacy and AI tools in one browser workspace."
};
