import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Lightbulb, 
  Code2, 
  Shield, 
  Sparkles,
  FileText
} from "lucide-react";

interface AIReviewDisplayProps {
  review: string;
}

interface ReviewSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function AIReviewDisplay({ review }: AIReviewDisplayProps) {
  const parseReview = (text: string): ReviewSection[] => {
    const sections: ReviewSection[] = [];
    
    // Define section patterns and their styles
    const sectionPatterns = [
      {
        pattern: /##\s*Overall Assessment/i,
        title: "Overall Assessment",
        icon: <FileText className="h-5 w-5" />,
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800"
      },
      {
        pattern: /##\s*Issues Found/i,
        title: "Issues Found",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800"
      },
      {
        pattern: /###\s*Critical/i,
        title: "Critical Issues",
        icon: <AlertCircle className="h-5 w-5" />,
        color: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800"
      },
      {
        pattern: /###\s*Warning/i,
        title: "Warnings",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "text-yellow-700 dark:text-yellow-300",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800"
      },
      {
        pattern: /###\s*Suggestion/i,
        title: "Suggestions",
        icon: <Lightbulb className="h-5 w-5" />,
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800"
      },
      {
        pattern: /##\s*Code Improvements/i,
        title: "Code Improvements",
        icon: <Code2 className="h-5 w-5" />,
        color: "text-purple-700 dark:text-purple-300",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-800"
      },
      {
        pattern: /##\s*Best Practices/i,
        title: "Best Practices",
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "text-teal-700 dark:text-teal-300",
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        borderColor: "border-teal-200 dark:border-teal-800"
      },
      {
        pattern: /##\s*Security Considerations/i,
        title: "Security Considerations",
        icon: <Shield className="h-5 w-5" />,
        color: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800"
      },
      {
        pattern: /##\s*Final Note|##\s*Summary/i,
        title: "Summary",
        icon: <Sparkles className="h-5 w-5" />,
        color: "text-indigo-700 dark:text-indigo-300",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        borderColor: "border-indigo-200 dark:border-indigo-800"
      }
    ];

    // Split by main sections (##)
    const mainParts = text.split(/(?=##\s)/);
    
    mainParts.forEach(part => {
      if (!part.trim()) return;
      
      // Check if it's a subsection (###)
      if (part.match(/^###\s/)) {
        const subSectionPattern = sectionPatterns.find(p => p.pattern.test(part));
        if (subSectionPattern) {
          sections.push({
            title: subSectionPattern.title,
            content: part.replace(subSectionPattern.pattern, "").trim(),
            icon: subSectionPattern.icon,
            color: subSectionPattern.color,
            bgColor: subSectionPattern.bgColor,
            borderColor: subSectionPattern.borderColor
          });
        }
      } else {
        // Main section
        const mainPattern = sectionPatterns.find(p => p.pattern.test(part));
        if (mainPattern) {
          // Check for subsections within this main section
          const subParts = part.split(/(?=###\s)/);
          
          // Add main section header
          const mainContent = subParts[0].replace(mainPattern.pattern, "").trim();
          if (mainContent) {
            sections.push({
              title: mainPattern.title,
              content: mainContent,
              icon: mainPattern.icon,
              color: mainPattern.color,
              bgColor: mainPattern.bgColor,
              borderColor: mainPattern.borderColor
            });
          }
          
          // Add subsections
          subParts.slice(1).forEach(subPart => {
            const subPattern = sectionPatterns.find(p => p.pattern.test(subPart));
            if (subPattern) {
              sections.push({
                title: subPattern.title,
                content: subPart.replace(subPattern.pattern, "").trim(),
                icon: subPattern.icon,
                color: subPattern.color,
                bgColor: subPattern.bgColor,
                borderColor: subPattern.borderColor
              });
            }
          });
        } else {
          // Unrecognized section, treat as general content
          sections.push({
            title: "Analysis",
            content: part,
            icon: <FileText className="h-5 w-5" />,
            color: "text-gray-700 dark:text-gray-300",
            bgColor: "bg-gray-50 dark:bg-gray-900/20",
            borderColor: "border-gray-200 dark:border-gray-800"
          });
        }
      }
    });

    return sections;
  };

  const formatContent = (content: string): React.ReactNode => {
    // Split content by lines
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if it's a list item
      if (trimmedLine.match(/^[-*]\s/)) {
        if (!inList) {
          inList = true;
        }
        currentList.push(trimmedLine.replace(/^[-*]\s/, ""));
      } else if (trimmedLine.match(/^\d+\.\s/)) {
        if (!inList) {
          inList = true;
        }
        currentList.push(trimmedLine.replace(/^\d+\.\s/, ""));
      } else {
        // End of list
        if (inList && currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mt-2 ml-2">
              {currentList.map((item, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  {formatInlineText(item)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        
        // Regular paragraph
        if (trimmedLine) {
          elements.push(
            <p key={`p-${index}`} className="text-sm leading-relaxed mt-2">
              {formatInlineText(trimmedLine)}
            </p>
          );
        }
      }
    });

    // Handle any remaining list items
    if (inList && currentList.length > 0) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside space-y-1 mt-2 ml-2">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Split by inline code
    const parts = text.split(/(`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.match(/^`[^`]+`$/)) {
        // Inline code
        const code = part.slice(1, -1);
        return (
          <code 
            key={index}
            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-pink-600 dark:text-pink-400"
          >
            {code}
          </code>
        );
      }
      return part;
    });
  };

  const sections = parseReview(review);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Card 
          key={index} 
          className={`${section.borderColor} border-2 overflow-hidden`}
        >
          <CardHeader className={`${section.bgColor} py-3 px-4`}>
            <CardTitle className={`text-base flex items-center gap-2 ${section.color}`}>
              {section.icon}
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="prose dark:prose-invert prose-sm max-w-none">
              {formatContent(section.content)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
