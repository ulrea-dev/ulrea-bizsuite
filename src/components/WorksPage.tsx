import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, FolderKanban, ListChecks, Repeat, Calendar, AlertCircle } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { EnhancedProjectModal } from './EnhancedProjectModal';
import { ProjectCard } from './ProjectCard';
import { Project } from '@/types/business';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickTasksPage } from './QuickTasksPage';
import { RetainersPage } from './RetainersPage';
import { formatCurrency } from '@/utils/storage';
import { useRenewalReminders } from '@/hooks/useRenewalReminders';
import { Badge } from '@/components/ui/badge';

interface WorksPageProps {
  onNavigateToPage?: (page: string, itemId?: string) => void;
}

const VALID_TABS = ['projects', 'quick-tasks', 'retainers', 'renewals'] as const;
type TabValue = typeof VALID_TABS[number];

export const WorksPage: React.FC<WorksPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue) ? (tabParam as TabValue) : 'projects';
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { totalDueSoon, overdueCount } = useRenewalReminders();

  const handleTabChange = (value: string) => {
    if (value === 'renewals') {
      navigate('/works/renewals');
      return;
    }
    setSearchParams({ tab: value });
  };

  const currentProjects = data.projects.filter(project => 
    project.businessId === currentBusiness?.id
  );

  const filteredProjects = currentProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    setSelectedProject(null);
    setModalMode('create');
    setShowProjectModal(true);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setModalMode('view');
    setShowProjectModal(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setModalMode('edit');
    setShowProjectModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    const firstConfirmation = confirm(
      `Are you sure you want to delete the project "${project.name}"?`
    );
    
    if (!firstConfirmation) return;
    
    const secondConfirmation = confirm(
      `This action cannot be undone. All project data, payments, and allocations will be permanently deleted.\n\nType "DELETE" to confirm you want to proceed.`
    );
    
    if (!secondConfirmation) return;
    
    dispatch({
      type: 'DELETE_PROJECT',
      payload: project.id
    });
    
    toast({
      title: "Project Deleted",
      description: `Project "${project.name}" has been permanently deleted.`,
      variant: "destructive"
    });
  };

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No Business Selected</h3>
            <p className="text-muted-foreground">Please select a business to manage works</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary stats
  const activeProjects = currentProjects.filter(p => p.status === 'active');
  const currentQuickTasks = data.quickTasks?.filter(task => task.businessId === currentBusiness.id) || [];
  const activeQuickTasks = currentQuickTasks.filter(task => task.status === 'active' || task.status === 'pending');
  const currentRetainers = data.retainers?.filter(retainer => retainer.businessId === currentBusiness.id) || [];
  const activeRetainers = currentRetainers.filter(retainer => retainer.status === 'active');
  const retainerMRR = activeRetainers.reduce((sum, retainer) => sum + retainer.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Works</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage projects, quick tasks, and retainers for {currentBusiness.name}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20">
              <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">{activeProjects.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/20">
              <ListChecks className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Tasks</p>
              <p className="text-2xl font-bold">{activeQuickTasks.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20">
              <Repeat className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retainer MRR</p>
              <p className="text-2xl font-bold">{formatCurrency(retainerMRR, currentBusiness.currency)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-auto sm:grid sm:grid-cols-4">
            <TabsTrigger value="projects" className="gap-1.5 text-xs sm:text-sm">
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="quick-tasks" className="gap-1.5 text-xs sm:text-sm">
              <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Quick Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="retainers" className="gap-1.5 text-xs sm:text-sm">
              <Repeat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Retainers</span>
            </TabsTrigger>
            <TabsTrigger value="renewals" className="gap-1.5 text-xs sm:text-sm relative">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Renewals</span>
              {totalDueSoon > 0 && (
                <Badge 
                  variant={overdueCount > 0 ? "destructive" : "secondary"}
                  className="ml-1 h-5 min-w-5 px-1 text-xs"
                >
                  {totalDueSoon}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="projects" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Projects</h2>
            </div>
            <Button onClick={handleCreateProject} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 dashboard-text-secondary" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 dashboard-surface-elevated rounded-full mb-4">
                  <Plus className="h-8 w-8 dashboard-text-secondary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No projects match your current filters'
                    : 'Get started by creating your first project'
                  }
                </p>
                <Button onClick={handleCreateProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredProjects.map(project => (
                <div key={project.id} className="relative group">
                  <ProjectCard 
                    project={project} 
                    currency={currentBusiness.currency}
                    clientName={project.clientId ? data.clients.find(c => c.id === project.clientId)?.name : undefined}
                    teamMembers={project.allocationTeamAllocations?.map(alloc => ({
                        id: alloc.memberId,
                        name: alloc.memberName
                       })) || []}
                    onNavigateToClient={() => {
                      onNavigateToPage?.('clients');
                    }}
                    onNavigateToTeam={() => {
                      onNavigateToPage?.('team');
                    }}
                    onNavigateToProject={(projectId) => {
                      onNavigateToPage?.('works', projectId);
                    }}
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <EnhancedProjectModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            project={selectedProject}
            mode={modalMode}
          />
        </TabsContent>

        <TabsContent value="quick-tasks" className="space-y-6">
          <QuickTasksPage />
        </TabsContent>

        <TabsContent value="retainers" className="space-y-6">
          <RetainersPage isEmbedded />
        </TabsContent>
      </Tabs>
    </div>
  );
};
