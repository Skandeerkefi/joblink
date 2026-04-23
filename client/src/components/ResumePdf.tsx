import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from '@react-pdf/renderer'
import type { ManualData } from '../types/resume'

const BLUE = '#1e40af'
const DARK = '#111827'
const GRAY = '#4b5563'
const LIGHT_GRAY = '#f3f4f6'
const BORDER = '#e5e7eb'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DARK,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },
  header: {
    marginBottom: 16,
    borderBottom: `2px solid ${BLUE}`,
    paddingBottom: 12,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 9,
    color: GRAY,
  },
  contactItem: {
    fontSize: 9,
    color: GRAY,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 3,
    marginBottom: 6,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  entryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  entryDate: {
    fontSize: 9,
    color: GRAY,
  },
  entrySubtitle: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 3,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 10,
    color: BLUE,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: GRAY,
  },
  summaryText: {
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.5,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    color: DARK,
  },
  entryBlock: {
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 9,
    color: GRAY,
    marginTop: 2,
  },
})

interface Props {
  data: ManualData
}

export default function ResumePdf({ data }: Props) {
  const { personalInfo, summary, skills, languages, certifications, education, experience, projects } = data

  // Build an array of contact items to render separators correctly
  const contactItems: { text: string; href?: string }[] = []
  if (personalInfo.email) contactItems.push({ text: personalInfo.email })
  if (personalInfo.phone) contactItems.push({ text: personalInfo.phone })
  if (personalInfo.location) contactItems.push({ text: personalInfo.location })
  personalInfo.links?.filter(Boolean).forEach((link) => contactItems.push({ text: link, href: link }))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.fullName || 'Your Name'}</Text>
          <View style={styles.contactRow}>
            {contactItems.map((item, i) =>
              item.href ? (
                <Link key={i} src={item.href} style={{ ...styles.contactItem, color: BLUE }}>
                  {i > 0 ? '· ' : ''}{item.text}
                </Link>
              ) : (
                <Text key={i} style={styles.contactItem}>
                  {i > 0 ? '· ' : ''}{item.text}
                </Text>
              )
            )}
          </View>
        </View>

        {/* Summary */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* Skills */}
        {skills && skills.filter(Boolean).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsWrap}>
              {skills.filter(Boolean).map((skill, i) => (
                <Text key={i} style={styles.skillBadge}>{skill}</Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Languages */}
        {languages && languages.filter(Boolean).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsWrap}>
              {languages.filter(Boolean).map((language, i) => (
                <Text key={i} style={styles.skillBadge}>{language}</Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Experience */}
        {experience && experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp, i) => (
              <View key={i} style={styles.entryBlock}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{exp.title}{exp.company ? ` — ${exp.company}` : ''}</Text>
                  <Text style={styles.entryDate}>
                    {exp.startDate}{exp.current ? ' – Present' : exp.endDate ? ` – ${exp.endDate}` : ''}
                  </Text>
                </View>
                {exp.location ? <Text style={styles.entrySubtitle}>{exp.location}</Text> : null}
                {exp.bullets?.filter(Boolean).map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Certifications */}
        {certifications && certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={styles.entryBlock}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{cert.name}</Text>
                  {cert.issueDate ? <Text style={styles.entryDate}>{cert.issueDate}</Text> : null}
                </View>
                <Text style={styles.entrySubtitle}>
                  {[cert.issuer, cert.credentialId ? `ID: ${cert.credentialId}` : ''].filter(Boolean).join(' · ')}
                </Text>
                {cert.link ? (
                  <Link src={cert.link} style={{ ...styles.entryDate, color: BLUE }}>{cert.link}</Link>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {education && education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.entryBlock}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</Text>
                  <Text style={styles.entryDate}>
                    {edu.startYear}{edu.endYear ? ` – ${edu.endYear}` : ''}
                  </Text>
                </View>
                {edu.school ? <Text style={styles.entrySubtitle}>{edu.school}</Text> : null}
                {edu.details ? <Text style={styles.detailsText}>{edu.details}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, i) => (
              <View key={i} style={styles.entryBlock}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                  {proj.link ? (
                    <Link src={proj.link} style={{ ...styles.entryDate, color: BLUE }}>{proj.link}</Link>
                  ) : null}
                </View>
                {proj.description ? <Text style={styles.entrySubtitle}>{proj.description}</Text> : null}
                {proj.bullets?.filter(Boolean).map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
