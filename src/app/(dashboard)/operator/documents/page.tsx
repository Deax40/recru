import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { BookOpen, Download, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { DocumentViewButton } from "@/components/operator/document-view-button";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const categories = await prisma.documentCategory.findMany({
    include: {
      documents: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        include: {
          reads: {
            where: { userId: session.user.id },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const totalDocs = categories.reduce((s, c) => s + c.documents.length, 0);
  const readDocs = categories.reduce((s, c) =>
    s + c.documents.filter(d => d.reads.length > 0).length, 0);
  const mandatoryUnread = categories.reduce((s, c) =>
    s + c.documents.filter(d => d.isMandatory && d.reads.length === 0).length, 0);

  return (
    <>
      <DashboardHeader
        title="Documents & Formation"
        subtitle={`${readDocs}/${totalDocs} documents lus`}
        role="OPERATOR"
      />
      <PageContent>
        {mandatoryUnread > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              <strong>{mandatoryUnread} document(s) obligatoire(s)</strong> à lire. Veuillez les consulter dès que possible.
            </p>
          </div>
        )}

        {categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">Aucun document disponible</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              cat.documents.length > 0 && (
                <Card key={cat.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cat.documents.map((doc) => {
                        const isRead = doc.reads.length > 0;
                        return (
                          <div key={doc.id} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isRead ? "bg-emerald-100" : "bg-primary/10"}`}>
                              {isRead
                                ? <CheckCircle className="h-5 w-5 text-emerald-600" />
                                : <BookOpen className="h-5 w-5 text-primary" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{doc.title}</p>
                                {doc.isMandatory && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                    Obligatoire
                                  </Badge>
                                )}
                                {!isRead && (
                                  <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                                    Non lu
                                  </Badge>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{doc.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Version {doc.version} — {formatDate(doc.updatedAt)}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <DocumentViewButton documentId={doc.id} isRead={isRead} isMandatory={doc.isMandatory} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}
