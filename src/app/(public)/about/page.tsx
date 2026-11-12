"use client"

import { motion } from "framer-motion"
import {
  TrendingUp, Shield, Globe, Users, Target, Award, Sparkles,
  BarChart3, HeartHandshake, Lightbulb, Eye, Zap,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const stats = [
  { label: "Active Users", value: "50,000+", icon: Users },
  { label: "Countries Served", value: "120+", icon: Globe },
  { label: "Total Invested", value: "$2B+", icon: BarChart3 },
  { label: "Years Experience", value: "5+", icon: Award },
]

const values = [
  {
    icon: Shield,
    title: "Security First",
    desc: "Enterprise-grade security infrastructure protecting every transaction and user data.",
  },
  {
    icon: Target,
    title: "Transparency",
    desc: "Clear, honest communication about risks, returns, and investment strategies.",
  },
  {
    icon: HeartHandshake,
    title: "Trust",
    desc: "Building long-term relationships through reliable service and consistent results.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    desc: "Leveraging cutting-edge AI and blockchain technology for optimal returns.",
  },
  {
    icon: Eye,
    title: "Vision",
    desc: "Creating a future where smart investing is accessible to everyone worldwide.",
  },
  {
    icon: Zap,
    title: "Speed",
    desc: "Fast execution, instant withdrawals, and real-time portfolio updates.",
  },
]

const teamMembers = [
  { name: "Alex Chen", role: "CEO & Founder", initials: "AC" },
  { name: "Sarah Johnson", role: "CTO", initials: "SJ" },
  { name: "Michael Torres", role: "Head of Investments", initials: "MT" },
  { name: "Emily Davis", role: "Chief Compliance Officer", initials: "ED" },
]

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
    >
      {children}
    </motion.div>
  )
}

export default function AboutPage() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <FadeInView>
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              About InvestPro
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">
              Empowering Smart Investments
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We are on a mission to democratize investing by providing everyone with access to
              professional-grade investment tools, curated plans, and real-time market insights.
            </p>
          </div>
        </FadeInView>

        {/* Stats */}
        <FadeInView delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4 }}
                className="text-center p-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-border/40"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold font-display text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </FadeInView>

        {/* Mission */}
        <FadeInView delay={0.2}>
          <div className="mb-20">
            <Card className="bg-gradient-to-r from-primary/5 via-background to-primary/5 border-border/50 overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-gradient">Our Mission</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      At InvestPro, we believe financial freedom should be accessible to everyone.
                      Our AI-powered platform removes the complexity from investing, offering
                      curated plans that match your risk tolerance and financial goals.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      With real-time market data, transparent fee structures, and dedicated support,
                      we empower both new and experienced investors to grow their wealth confidently.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Sparkles className="h-16 w-16 text-primary" />
                      </div>
                      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeInView>

        {/* Values */}
        <FadeInView delay={0.3}>
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-gradient mb-3">Our Core Values</h2>
              <p className="text-muted-foreground">The principles that guide everything we do</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="bg-card/50 border-border/50 h-full group hover:border-primary/30 transition-all">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-display font-semibold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeInView>

        {/* Team */}
        <FadeInView delay={0.4}>
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-gradient mb-3">Leadership Team</h2>
              <p className="text-muted-foreground">Experienced professionals driving our vision forward</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {teamMembers.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 flex items-center justify-center border border-primary/10">
                    <span className="text-2xl font-bold text-gradient">{member.initials}</span>
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeInView>

        {/* CTA */}
        <FadeInView delay={0.5}>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gradient mb-4">
              Ready to Join Us?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Start your investment journey today and become part of a growing community of smart investors.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <TrendingUp className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Investment Plans</Link>
              </Button>
            </div>
          </div>
        </FadeInView>
      </div>
    </div>
  )
}
