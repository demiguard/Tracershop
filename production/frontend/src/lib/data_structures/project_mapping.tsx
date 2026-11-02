import React from "react";
import { ProjectActivityOrder, ProjectEndpoint, ProjectInjectionOrder } from "~/dataclasses/dataclasses";
import { ArrayMap } from "../array_map";
import { createContext, useContext, useMemo } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";

class ProjectMapping {
  projectToEndpoints : ArrayMap<number, number>
  endpointsToProjects : ArrayMap<number, number>
  activityOrdersForProject : ArrayMap<number, number>
  injectionOrdersForProject : ArrayMap<number, number>


  constructor(
      projectEndpoints: Map<number, ProjectEndpoint>,
      activityMapping: Map<number, ProjectActivityOrder>,
      injectionMapping: Map<number, ProjectInjectionOrder>
  ){
    this.projectToEndpoints = new ArrayMap();
    this.endpointsToProjects = new ArrayMap();
    this.activityOrdersForProject = new ArrayMap();
    this.injectionOrdersForProject = new ArrayMap();

    for(const pe of projectEndpoints.values()){
      this.endpointsToProjects.set(pe.endpoint, pe.project);
      this.projectToEndpoints.set(pe.project, pe.endpoint);
    }

    for(const pao of activityMapping.values()){
      this.activityOrdersForProject.set(pao.project, pao.order);
    }

    for(const pio of injectionMapping.values()){
      this.activityOrdersForProject.set(pio.project, pio.order);
    }
  }
};

const ProjectMappingContext = createContext(new ProjectMapping(new Map(), new Map(), new Map()));

export function useProjectMapping(){
  return useContext(ProjectMappingContext);
}

export function ProjectMappingProvider({children}){
  const state = useTracershopState()

  const projectMapping = useMemo(() => {
    return new ProjectMapping(state.project_endpoint, state.project_activity, state.project_injection)
  }, [state.project_endpoint, state.project_activity, state.project_injection]);

  return (
    <ProjectMappingContext.Provider value={projectMapping}>
      {children}
    </ProjectMappingContext.Provider>
  );
}