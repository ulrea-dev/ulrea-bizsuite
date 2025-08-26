
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { EnhancedProjectModal } from './EnhancedProjectModal';
import { ProjectCard } from './ProjectCard';
import { Project } from '@/types/business';
import { toast } from '@/hooks/use-toast';

interface ProjectsPageProps {
  onNavigateToPage?: (page: string, itemId?: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
            <p className="text-muted-foreground">Please select a business to manage projects</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dashboard-text-primary">Projects</h1>
          <p className="dashboard-text-secondary">Manage your projects for {currentBusiness.name}</p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 dashboard-text-secondary" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  onNavigateToPage?.('projects', projectId);
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
    </div>
  );
};
