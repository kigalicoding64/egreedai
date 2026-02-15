import { BuilderComponent, BuilderTemplate } from '@/types/builder';
import { cn } from '@/lib/utils';

const TEMPLATES: BuilderTemplate[] = [
  {
    id: 'landing-1',
    name: 'SaaS Landing Page',
    description: 'Modern landing page with hero, features, pricing, and CTA',
    thumbnail: '🚀',
    category: 'saas',
    components: [
      { id: 't1-nav', type: 'navbar', props: { brand: 'SaaSify', links: ['Features', 'Pricing', 'About', 'Contact'] } },
      { id: 't1-hero', type: 'hero', props: { title: 'Build Better Products Faster', subtitle: 'The all-in-one platform that helps teams ship beautiful software.', ctaText: 'Start Free Trial' } },
      { id: 't1-h', type: 'heading', props: { text: 'Why Choose Us?', level: 'h2' }, styles: { textAlign: 'center', padding: '60px 20px 20px' } },
      { id: 't1-grid', type: 'grid', props: { columns: 3, gap: '24px' }, styles: { padding: '20px 40px 60px' }, children: [
        { id: 't1-c1', type: 'card', props: { title: '⚡ Lightning Fast', description: 'Optimized performance that loads in milliseconds.' } },
        { id: 't1-c2', type: 'card', props: { title: '🔒 Secure by Default', description: 'Enterprise-grade security built into every layer.' } },
        { id: 't1-c3', type: 'card', props: { title: '📊 Analytics Built-in', description: 'Deep insights into user behavior and engagement.' } },
      ]},
      { id: 't1-pricing', type: 'pricing', props: { plans: [{ name: 'Starter', price: '$9', features: ['5 Projects', '10GB Storage', 'Email Support'] }, { name: 'Pro', price: '$29', features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'API Access'] }, { name: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Account Manager', 'SLA'] }] }, styles: { padding: '40px' } },
      { id: 't1-cta', type: 'cta', props: { title: 'Ready to Transform Your Workflow?', subtitle: 'Join 10,000+ teams already using SaaSify.', buttonText: 'Get Started Free', buttonHref: '#' } },
      { id: 't1-footer', type: 'footer', props: { brand: 'SaaSify', links: ['Privacy', 'Terms', 'Support'], copyright: '© 2026 SaaSify. All rights reserved.' } },
    ],
  },
  {
    id: 'portfolio-1',
    name: 'Portfolio',
    description: 'Personal portfolio with bio, projects, and contact',
    thumbnail: '🎨',
    category: 'portfolio',
    components: [
      { id: 'p1-nav', type: 'navbar', props: { brand: 'Jane Doe', links: ['Work', 'About', 'Contact'] } },
      { id: 'p1-hero', type: 'hero', props: { title: "Hi, I'm Jane 👋", subtitle: 'A creative designer & developer crafting digital experiences.', ctaText: 'View My Work' } },
      { id: 'p1-h', type: 'heading', props: { text: 'Featured Projects', level: 'h2' }, styles: { textAlign: 'center', padding: '60px 20px 20px' } },
      { id: 'p1-grid', type: 'grid', props: { columns: 2, gap: '24px' }, styles: { padding: '20px 40px 60px' }, children: [
        { id: 'p1-c1', type: 'card', props: { title: 'E-Commerce Redesign', description: 'A complete overhaul of an online store increasing conversions by 40%.' } },
        { id: 'p1-c2', type: 'card', props: { title: 'Mobile Banking App', description: 'Designed the UX for a fintech startup serving 500K+ users.' } },
        { id: 'p1-c3', type: 'card', props: { title: 'Brand Identity System', description: 'Created comprehensive brand guidelines for a health-tech company.' } },
        { id: 'p1-c4', type: 'card', props: { title: 'SaaS Dashboard', description: 'Built an analytics dashboard with real-time data visualization.' } },
      ]},
      { id: 'p1-test', type: 'testimonial', props: { quote: 'Jane is an exceptional designer who brings both creativity and strategic thinking to every project.', author: 'Alex Chen', role: 'CTO, TechCorp' } },
      { id: 'p1-cta', type: 'cta', props: { title: "Let's Work Together", subtitle: 'Have a project in mind? I would love to hear from you.', buttonText: 'Get In Touch', buttonHref: '#' } },
      { id: 'p1-footer', type: 'footer', props: { links: ['Twitter', 'LinkedIn', 'Dribbble'], copyright: '© 2026 Jane Doe. All rights reserved.' } },
    ],
  },
  {
    id: 'agency-1',
    name: 'Agency Website',
    description: 'Digital agency with services, team, and FAQ',
    thumbnail: '🏢',
    category: 'agency',
    components: [
      { id: 'a1-nav', type: 'navbar', props: { brand: 'PixelForge', links: ['Services', 'Portfolio', 'Team', 'Contact'] } },
      { id: 'a1-hero', type: 'hero', props: { title: 'We Build Digital Products That Matter', subtitle: 'Strategy, design, and development for ambitious brands.', ctaText: 'Start a Project' } },
      { id: 'a1-h', type: 'heading', props: { text: 'Our Services', level: 'h2' }, styles: { textAlign: 'center', padding: '60px 20px 20px' } },
      { id: 'a1-grid', type: 'grid', props: { columns: 3, gap: '24px' }, styles: { padding: '20px 40px 60px' }, children: [
        { id: 'a1-c1', type: 'card', props: { title: '🎨 UI/UX Design', description: 'User-centered design that converts visitors into customers.' } },
        { id: 'a1-c2', type: 'card', props: { title: '💻 Web Development', description: 'Fast, scalable websites and web applications.' } },
        { id: 'a1-c3', type: 'card', props: { title: '📱 Mobile Apps', description: 'Native and cross-platform mobile experiences.' } },
      ]},
      { id: 'a1-faq', type: 'faq', props: { items: [{ question: 'What is your typical project timeline?', answer: 'Most projects take 4-8 weeks depending on scope.' }, { question: 'Do you offer ongoing support?', answer: 'Yes, we offer monthly retainer packages for ongoing work.' }, { question: 'How do you handle pricing?', answer: 'We provide fixed-price quotes based on detailed project scoping.' }] }, styles: { padding: '40px' } },
      { id: 'a1-cta', type: 'cta', props: { title: 'Have a Project in Mind?', subtitle: "Let's discuss how we can help bring your vision to life.", buttonText: 'Schedule a Call', buttonHref: '#' } },
      { id: 'a1-footer', type: 'footer', props: { brand: 'PixelForge', links: ['Careers', 'Blog', 'Privacy'], copyright: '© 2026 PixelForge Agency. All rights reserved.' } },
    ],
  },
  {
    id: 'blog-1',
    name: 'Blog / Content',
    description: 'Minimal blog layout with articles',
    thumbnail: '📝',
    category: 'blog',
    components: [
      { id: 'b1-nav', type: 'navbar', props: { brand: 'The Daily Read', links: ['Home', 'Tech', 'Design', 'About'] } },
      { id: 'b1-hero', type: 'hero', props: { title: 'Stories That Inspire', subtitle: 'Thoughts on technology, design, and building things that matter.', ctaText: 'Read Latest' } },
      { id: 'b1-h', type: 'heading', props: { text: 'Recent Articles', level: 'h2' }, styles: { padding: '40px 20px 20px', textAlign: 'center' } },
      { id: 'b1-grid', type: 'grid', props: { columns: 2, gap: '24px' }, styles: { padding: '20px 40px 60px' }, children: [
        { id: 'b1-c1', type: 'card', props: { title: 'The Future of AI in Design', description: 'How artificial intelligence is reshaping the creative industry.' } },
        { id: 'b1-c2', type: 'card', props: { title: 'Building for Scale', description: 'Lessons learned from scaling a product to 1M users.' } },
        { id: 'b1-c3', type: 'card', props: { title: 'Design Systems Done Right', description: 'A practical guide to building maintainable design systems.' } },
        { id: 'b1-c4', type: 'card', props: { title: 'Remote Work Culture', description: 'How to build a thriving company culture with distributed teams.' } },
      ]},
      { id: 'b1-footer', type: 'footer', props: { links: ['RSS', 'Newsletter', 'Twitter'], copyright: '© 2026 The Daily Read. All rights reserved.' } },
    ],
  },
  {
    id: 'ecommerce-1',
    name: 'E-Commerce Store',
    description: 'Online store with products and checkout',
    thumbnail: '🛒',
    category: 'ecommerce',
    components: [
      { id: 'e1-nav', type: 'navbar', props: { brand: 'ShopWave', links: ['Shop', 'Collections', 'Sale', 'About'] } },
      { id: 'e1-hero', type: 'hero', props: { title: 'New Season Collection', subtitle: 'Discover our latest arrivals with up to 40% off.', ctaText: 'Shop Now' } },
      { id: 'e1-h', type: 'heading', props: { text: 'Featured Products', level: 'h2' }, styles: { textAlign: 'center', padding: '60px 20px 20px' } },
      { id: 'e1-grid', type: 'grid', props: { columns: 3, gap: '24px' }, styles: { padding: '20px 40px 60px' }, children: [
        { id: 'e1-c1', type: 'card', props: { title: 'Premium Headphones', description: 'Wireless noise-canceling — $299' } },
        { id: 'e1-c2', type: 'card', props: { title: 'Smart Watch Pro', description: 'Health tracking & notifications — $199' } },
        { id: 'e1-c3', type: 'card', props: { title: 'Leather Backpack', description: 'Handcrafted Italian leather — $149' } },
      ]},
      { id: 'e1-test', type: 'testimonial', props: { quote: 'Best online shopping experience I have ever had. Fast shipping and amazing quality!', author: 'Sarah M.', role: 'Verified Customer' } },
      { id: 'e1-cta', type: 'cta', props: { title: 'Get 15% Off Your First Order', subtitle: 'Sign up for our newsletter and save on your first purchase.', buttonText: 'Subscribe', buttonHref: '#' } },
      { id: 'e1-footer', type: 'footer', props: { brand: 'ShopWave', links: ['Returns', 'Shipping', 'FAQ', 'Contact'], copyright: '© 2026 ShopWave. All rights reserved.' } },
    ],
  },
];

interface TemplateGalleryProps {
  onSelectTemplate: (components: BuilderComponent[]) => void;
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const generateNewIds = (components: BuilderComponent[]): BuilderComponent[] =>
    components.map(c => ({
      ...c,
      id: Math.random().toString(36).substring(2, 11),
      children: c.children ? generateNewIds(c.children) : undefined,
    }));

  return (
    <div className="space-y-3">
      {TEMPLATES.map(template => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate(generateNewIds(template.components))}
          className={cn(
            'w-full text-left p-3 rounded-lg border border-border bg-card',
            'hover:border-primary/40 hover:bg-accent transition-all group'
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{template.thumbnail}</span>
            <div>
              <p className="font-medium text-sm group-hover:text-primary transition-colors">{template.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                {template.category}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
