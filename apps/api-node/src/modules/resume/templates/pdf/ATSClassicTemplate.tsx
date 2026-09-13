// @ts-nocheck
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { IResumeRenderDocument, IRenderExperience, IRenderEducation, IRenderProject } from "../renderModel";

// Register fonts if needed, for ATS Classic we'll use Helvetica which is built-in.

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 15,
    textAlign: "center",
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 12,
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: "#333333",
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    paddingBottom: 2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 10,
  },
  itemBlock: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: "Helvetica-Bold",
  },
  itemSubtitle: {
    fontFamily: "Helvetica-Oblique",
  },
  itemDate: {
    fontSize: 9,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 10,
  },
  bulletPoint: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
  },
  skillGroup: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    width: 70,
  },
  skillItems: {
    flex: 1,
  }
});

interface Props {
  doc: IResumeRenderDocument;
  pageSize: "A4" | "Letter";
}

export const ATSClassicTemplate: React.FC<Props> = ({ doc, pageSize }) => {
  const { header, sections } = doc;

  const contactParts = [header.email, header.phone, header.location].filter(Boolean);
  const links = [header.linkedin, header.github, header.portfolio, header.website].filter(Boolean);
  const contactString = [...contactParts, ...links].join(" | ");

  return (
    <Document>
      <Page size={pageSize === "Letter" ? "LETTER" : pageSize} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{header.name}</Text>
          {header.title && <Text style={styles.title}>{header.title}</Text>}
          <Text style={styles.contact}>{contactString}</Text>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.id} style={styles.section} wrap={false}>
            <Text style={styles.sectionHeading}>{section.title}</Text>

            {section.type === "summary" && (
              <Text style={styles.summaryText}>{section.content as string}</Text>
            )}

            {section.type === "experience" && (
              (section.content as IRenderExperience[]).map((exp) => (
                <View key={exp.id} style={styles.itemBlock} wrap={false}>
                  <View style={styles.itemHeader}>
                    <Text>
                      <Text style={styles.itemTitle}>{exp.role}</Text>
                      <Text style={styles.itemSubtitle}> — {exp.company}</Text>
                    </Text>
                    <Text style={styles.itemDate}>{exp.dateRange} | {exp.location}</Text>
                  </View>
                  {exp.bullets.map((bullet, i) => (
                    <View key={i} style={styles.bulletItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}

            {section.type === "education" && (
              (section.content as IRenderEducation[]).map((edu) => (
                <View key={edu.id} style={styles.itemBlock} wrap={false}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{edu.institution}</Text>
                    <Text style={styles.itemDate}>{edu.dateRange}</Text>
                  </View>
                  <Text>
                    {edu.degree}{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                  </Text>
                </View>
              ))
            )}

            {section.type === "projects" && (
              (section.content as IRenderProject[]).map((proj) => (
                <View key={proj.id} style={styles.itemBlock} wrap={false}>
                  <View style={styles.itemHeader}>
                    <Text>
                      <Text style={styles.itemTitle}>{proj.name}</Text>
                      {proj.technologies && <Text style={styles.itemSubtitle}> | {proj.technologies}</Text>}
                    </Text>
                  </View>
                  {proj.bullets.map((bullet, i) => (
                    <View key={i} style={styles.bulletItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}

            {section.type === "skills" && (
              (section.content as {category: string, items: string}[]).map((group, i) => (
                <View key={i} style={styles.skillGroup} wrap={false}>
                  <Text style={styles.skillCategory}>{group.category}:</Text>
                  <Text style={styles.skillItems}>{group.items}</Text>
                </View>
              ))
            )}
            
            {section.type === "certifications" && (
              (section.content as any[]).map((cert, i) => (
                <View key={i} style={styles.itemBlock} wrap={false}>
                  <Text>
                    <Text style={styles.itemTitle}>{cert.name}</Text>
                    <Text> — {cert.issuer} ({cert.date})</Text>
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
};
