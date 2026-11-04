// All prices, services, and photos live here. Update this file to change the site.
// Photos are Hennessy’s own work, downloaded from hennessywilliamsphoto.com. studio-room is still a low-res
// screenshot crop (flagged on the page); replace it with the original, same name, before launch.

export const site = {
  name: "Hennessy Williams Photo",
  email: "hennessywilliamsphoto@gmail.com",
  phone: "7739970423",
  phoneDisplay: "(773) 997-0423",
  instagram: "https://www.instagram.com/hennessywilliamsphoto/",
  instagramHandle: "@hennessywilliamsphoto",
  bookingUrl: "https://hennessywilliamsphoto54.pixieset.com/booking/",
  // Session-specific Pixieset booking links. Services without one fall back to bookingUrl (the general page).
  sessionBooking: {
    graduation: "https://hennessywilliamsphoto54.pixieset.com/booking/graduation",
    portraits: "https://hennessywilliamsphoto54.pixieset.com/booking/Portrait-standard",
    families: "https://hennessywilliamsphoto54.pixieset.com/booking/Family",
    celebrations: "https://hennessywilliamsphoto54.pixieset.com/booking/Celebration",
    weddings: "https://hennessywilliamsphoto54.pixieset.com/booking/wedding",
    studio: "https://hennessywilliamsphoto54.pixieset.com/booking/studio-rental",
    product: "https://hennessywilliamsphoto54.pixieset.com/booking/product",
    realEstate: "https://hennessywilliamsphoto54.pixieset.com/booking/real-estate",
  },
  galleryUrl: "https://hennessywilliamsphoto54.pixieset.com/",
  serviceArea: "Stockton + Sacramento",
};

export const navigation = [
  { label: "Sessions", href: "/sessions" },
  { label: "Business", href: "/business" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
];

const work = (name, ext = "jpg") => `/assets/photos/work/${name}.${ext}`;

export const photos = {
  gradBooks: { src: work("grad-books-stoles"), alt: "Photo placeholder: grad books stoles" },
  gradLibrary: { src: work("grad-library-hands"), alt: "Photo placeholder: grad library hands" },
  gradReading: { src: work("grad-confetti"), alt: "Photo placeholder: grad confetti" },
  gradSenior24: { src: work("grad-senior-24"), alt: "Photo placeholder: grad senior 24" },
  gradSeniorHeart: { src: work("grad-senior-heart"), alt: "Photo placeholder: grad senior heart" },
  gradSelfie: { src: work("grad-selfie"), alt: "Photo placeholder: grad selfie" },
  gradKente: { src: work("grad-kente"), alt: "Photo placeholder: grad kente" },
  gradDiploma: { src: work("grad-diploma"), alt: "Photo placeholder: grad diploma" },
  gradKinder: { src: work("grad-kinder"), alt: "Photo placeholder: grad kinder" },
  readerBooks: { src: work("reader-books"), alt: "Photo placeholder: reader books", position: "72% 50%" },
  womanChair: { src: work("portrait-chair-split"), alt: "Photo placeholder: portrait chair split" },
  portraitTurban: { src: work("portrait-turban"), alt: "Photo placeholder: portrait turban" },
  portraitFeathers: { src: work("portrait-feathers"), alt: "Photo placeholder: portrait feathers" },
  portraitPinkHair: { src: work("portrait-pink-hair"), alt: "Photo placeholder: portrait pink hair" },
  manLeaning: { src: work("portrait-man-leaning"), alt: "Photo placeholder: portrait man leaning" },
  manCanvas: { src: work("portrait-man-canvas"), alt: "Photo placeholder: portrait man canvas" },
  manLeather: { src: work("portrait-man-leather"), alt: "Photo placeholder: portrait man leather" },
  kidsFormal: { src: work("family-kids-formal"), alt: "Photo placeholder: family kids formal" },
  familyGray: { src: work("family-gray"), alt: "Photo placeholder: family gray" },
  familyPlaid: { src: work("family-plaid"), alt: "Photo placeholder: family plaid" },
  kidsYellow: { src: work("kids-yellow"), alt: "Photo placeholder: kids yellow" },
  babyFlamingo: { src: work("baby-flamingo"), alt: "Photo placeholder: baby flamingo" },
  birthdayTen: { src: work("birthday-ten"), alt: "Photo placeholder: birthday ten" },
  birthdayFifty: { src: work("birthday-fifty"), alt: "Photo placeholder: birthday fifty" },
  weddingRooftop: { src: work("wedding-chicago"), alt: "Photo placeholder: wedding chicago" },
  productPerfume: { src: work("product-perfume"), alt: "Photo placeholder: product perfume" },
  studioRoom: { src: work("studio-room", "png"), alt: "Photo placeholder: studio room", preview: true },
};

// Each service is a hang tag. `includes` comes from the published packages; nothing here is invented.
export const services = {
  graduation: {
    slug: "graduation",
    title: "Graduation",
    price: "From $145",
    photo: photos.gradReading,
    summary: "Cap and gown, campus or studio, your idea or ours.",
    includes: ["One curated look", "Three finished edits", "Private online gallery", "Campus or studio"],
  },
  portraits: {
    slug: "portraits",
    title: "Portraits",
    price: "From $145",
    photo: photos.portraitTurban,
    summary: "Individual and couple portraits directed around your style and energy.",
    includes: ["One outfit", "Three finished edits", "Private online gallery", "Your choice of backdrop"],
    gallery: ["manLeaning", "portraitFeathers", "portraitPinkHair"],
    goodToKnow: ["Want a second look? An extra outfit change can be added when you book.", "Shot in the studio on the backdrop color you choose."],
  },
  families: {
    slug: "families",
    title: "Families",
    price: "From $249",
    photo: photos.familyGray,
    chalk: "+$30 / person",
    summary: "Directed, warm family portraits with room for the unscripted moments.",
    includes: ["Up to five people", "One outfit", "Four finished edits", "Private online gallery", "Your choice of backdrop"],
    gallery: ["kidsFormal", "familyPlaid", "kidsYellow"],
    goodToKnow: ["Up to five people are included in the price.", "Each additional person or outfit change is $30."],
  },
  celebrations: {
    slug: "celebrations",
    title: "Celebrations",
    price: "From $375",
    photo: photos.birthdayTen,
    chalk: "+$75 / extra hour",
    summary: "Birthdays, proposals, maternity and milestones, covered start to finish.",
    includes: ["Two hours of coverage", "Every image in a password-protected gallery", "Solid-color backdrop on request", "Guest prints for an extra charge"],
    gallery: ["babyFlamingo", "birthdayFifty"],
    goodToKnow: ["Each hour after the first two is $75.", "A solid-color backdrop can be set up on request.", "Prints for guests are available for an extra charge."],
  },
  weddings: {
    slug: "weddings",
    title: "Weddings",
    price: "Custom quote",
    photo: photos.weddingRooftop,
    summary: "Engagements, elopements and weddings, told through portraits.",
    includes: ["Priced to your day", "Starts with a 30-minute call to plan coverage"],
    goodToKnow: ["Booking starts with a 30-minute call on the wedding calendar.", "Coverage and price are quoted for your day after the call."],
    bookLabel: "Book a wedding call",
    bookDetail: "30 minutes on the wedding calendar",
  },
  studio: {
    slug: "studio",
    title: "Studio rental",
    price: "From $50 / hour",
    photo: photos.studioRoom,
    summary: "A 650 sq ft creative space in the Stockton area for shoots and small productions.",
    includes: ["650 square feet", "12-foot roll-up door", "Makeup station", "Director’s chair, mirror and lights", "Backdrop access"],
    note: "Booked in 2-hour blocks: $100 per booking.",
  },
  realEstate: {
    slug: "realEstate",
    title: "Real estate",
    price: "$175",
    summary: "Listing photos for homes and rentals around Stockton and Sacramento.",
    includes: ["1-hour shoot at the property", "Booked online like any session"],
  },
  product: {
    slug: "product",
    title: "Product photography",
    price: "$25 per item",
    photo: photos.productPerfume,
    summary: "Clean, consistent product photos for local shops, makers and brands.",
    includes: ["Priced per item", "Booked by the item only"],
  },
};

export const sessionOrder = ["portraits", "families", "celebrations", "weddings"];

// Inquiry form choices. Values travel in the URL (?session=graduation) so a tag can pre-fill the form.
export const sessionChoices = [
  { value: "graduation", label: "Graduation" },
  { value: "portraits", label: "Portraits" },
  { value: "families", label: "Families" },
  { value: "celebrations", label: "Celebrations" },
  { value: "weddings", label: "Weddings" },
  { value: "studio", label: "Studio rental" },
  { value: "product", label: "Product photography" },
  { value: "realEstate", label: "Real estate" },
];

export const bookerChoices = [
  { value: "self", label: "Myself" },
  { value: "parent", label: "My graduate" },
  { value: "business", label: "My business" },
];

export const portfolio = [
  { id: 1, category: "Graduation", place: "Books and stoles", ...photos.gradBooks },
  { id: 2, category: "Portraits", place: "Split seamless", ...photos.womanChair },
  { id: 3, category: "Graduation", place: "Confetti", ...photos.gradReading },
  { id: 4, category: "Families", place: "White seamless", ...photos.kidsFormal },
  { id: 5, category: "Graduation", place: "Library concept", ...photos.gradLibrary },
  { id: 6, category: "Portraits", place: "Beauty", ...photos.portraitTurban },
  { id: 7, category: "Families", place: "Gray seamless", ...photos.familyGray },
  { id: 8, category: "Graduation", place: "Class of ’24", ...photos.gradSenior24 },
  { id: 9, category: "Portraits", place: "Doorway", ...photos.manLeaning },
  { id: 10, category: "Celebrations", place: "10th birthday", ...photos.birthdayTen },
  { id: 11, category: "Graduation", place: "Kindergarten", ...photos.gradKinder },
  { id: 12, category: "Portraits", place: "Feathers", ...photos.portraitFeathers },
  { id: 13, category: "Graduation", place: "Kente stole", ...photos.gradKente },
  { id: 14, category: "Portraits", place: "Canvas backdrop", ...photos.manCanvas },
  { id: 15, category: "Families", place: "Studio", ...photos.familyPlaid },
  { id: 16, category: "Graduation", place: "Diploma", ...photos.gradDiploma },
  { id: 17, category: "Portraits", place: "Book concept", ...photos.readerBooks },
  { id: 18, category: "Celebrations", place: "First birthday", ...photos.babyFlamingo },
  { id: 19, category: "Weddings", place: "Chicago rooftop", ...photos.weddingRooftop },
  { id: 20, category: "Graduation", place: "Selfie", ...photos.gradSelfie },
  { id: 21, category: "Families", place: "Siblings", ...photos.kidsYellow },
  { id: 22, category: "Portraits", place: "Pink curls", ...photos.portraitPinkHair },
  { id: 23, category: "Portraits", place: "Leather", ...photos.manLeather },
  { id: 24, category: "Graduation", place: "Class of ’24", ...photos.gradSeniorHeart },
  { id: 25, category: "Product", place: "Studio", ...photos.productPerfume },
];

// Empty on purpose. Add real client words (first name + session type) and the slots fill in.
export const reviews = [];

// Empty on purpose. Add campuses Hennessy has actually photographed.
export const campuses = [];

export const pageMeta = {
  "/": { title: "Hennessy Williams Photo | Portrait & Graduation Photography in Stockton", description: "Portrait and graduation sessions fitted to you, from $145. A 650 sq ft studio in Stockton, serving Sacramento." },
  "/sessions": { title: "Graduation, Portrait & Family Sessions | Hennessy Williams Photo", description: "Graduation portraits from $145 for graduates and parents. Portraits from $145, families from $249, celebrations from $375 and custom wedding coverage in Stockton and Sacramento." },
  "/business": { title: "Product, Real Estate & Studio Rental | Hennessy Williams Photo", description: "Rent a 650 sq ft Stockton studio from $50 an hour, book product photography at $25 per item, or real estate photos from $175." },
  "/work": { title: "Work | Hennessy Williams Photo", description: "Graduation, portrait, family and couple photography by Hennessy Williams." },
  "/about": { title: "About Hennessy | Hennessy Williams Photo", description: "From one black-and-white print on Chicago’s South Side to a portrait studio in Stockton." },
  "/contact": { title: "Contact | Hennessy Williams Photo", description: "Ask about a graduation, portrait, studio or product session in Stockton or Sacramento." },
  "/404": { title: "Page not found | Hennessy Williams Photo", description: "That page does not exist." },
};
