# AI Collaboration Log

Node: v24.20.0
npm: 11.19.0
Git: 2.55.0.windows.5

| Tool | Prompt | Output Used | Output Rejected | Verification | Commit |
|---|---|---|---|---|---|
| ChatGPT | Explain in plain language what this stack is and why it might be used for a neighborhood listing platform: Next.js, TypeScript, Tailwind CSS, accessible HTML, and Git/GitHub. | Used the explanations to understand what each technology does and why it fits the project. | Extra examples were not needed. | Compared the response with Gemini's explanation. | Document AI collaboration and verification |
| Gemini | Asked the same stack explanation question as ChatGPT. | Used its more detailed examples connecting the technologies to the neighborhood platform. | Some additional detail was unnecessary for the project. | Compared the response with ChatGPT's explanation. | Document AI collaboration and verification |
| Google AI Studio | Act as a senior teaching assistant. Propose a minimal Next.js App Router + TypeScript + Tailwind starter for a neighborhood property platform. Give a file plan, terminal commands, accessibility requirements, and a verification checklist. Never invent command results or credentials. | Used the file plan, commands, accessibility guidance, and verification checklist as guidance. | Did not copy the code dump directly into the project. | Ran the site locally and successfully ran npm run lint and npm run build. | Built neighborhood platform homepage |

## ChatGPT and Gemini Comparison

1. ChatGPT gave a shorter and more beginner-friendly explanation, while Gemini gave more detailed examples.

2. Gemini connected the technologies more directly to the neighborhood platform, while ChatGPT focused more on explaining what each technology does.
## Reusable Components and Accessibility

### ChatGPT Review

Prompt:
"Review this React component for semantic HTML, WCAG-oriented keyboard access, responsive behavior, and TypeScript safety. Return: issue, why it matters, smallest change, and a manual test. Do not claim compliance from code alone."

ChatGPT reviewed the PropertyCard component and suggested improving the predictability of the property image area by using an aspect ratio. I reviewed the suggestion rather than automatically applying it.

### Gemini Review

I gave Gemini the same accessibility and semantic HTML review task.

Gemini identified that each PropertyCard used an h2 even though the cards are located inside the "Available Properties" section, which already uses an h2.

Accepted suggestion:
I changed the PropertyCard heading from h2 to h3. This created a clearer hierarchy:

- h1: Neighborhood Listing Platform
- h2: Available Properties
- h3: Individual property titles

Rejected/not implemented suggestion:
I did not automatically implement every AI suggestion. For example, the image aspect-ratio suggestion was not necessary to resolve an accessibility failure, and the existing fixed image height and object-cover styling already produced a consistent layout during responsive testing.

### Verification

I manually tested the page at 375px, 768px, and 1280px. The property layout displayed 1, 2, and 3 columns respectively.

I tested keyboard navigation using Tab, Shift+Tab, Enter, and Space. All interactive controls were reachable in a logical order and displayed visible keyboard focus.

After changing the property headings to h3, I manually checked the page again and reran Lighthouse. The Accessibility score remained 100.

ESLint completed without errors, and the Next.js production build compiled successfully.