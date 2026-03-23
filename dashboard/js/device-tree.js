// Device Tree Component
class DeviceTree {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.selectedDevice = null;
    this.treeData = null;
  }

  init() {
    this.loadTree();
    this.setupSearch();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async loadTree() {
    const container = document.getElementById('deviceTree');
    if (!container) return;

    container.innerHTML = '<div class="loading">Đang tải...</div>';

    try {
      // Load projects
      const projectsResponse = await fetch(`${this.API_BASE}/projects`);
      const projectsResult = await projectsResponse.json();

      if (projectsResult.status === 'success') {
        this.treeData = await this.buildTree(projectsResult.projects);
        this.renderTree(container, this.treeData);
      }
    } catch (error) {
      console.error('Error loading device tree:', error);
      container.innerHTML = '<div class="loading">Lỗi khi tải dữ liệu</div>';
    }
  }

  async buildTree(projects) {
    const tree = [];

    for (const project of projects) {
      const projectNode = {
        id: `project-${project._id}`,
        type: 'project',
        label: project.name || project.code,
        data: project,
        children: []
      };

      // Load areas for this project
      try {
        const areasResponse = await fetch(`${this.API_BASE}/projects/${project._id}/areas`);
        const areasResult = await areasResponse.json();

        if (areasResult.status === 'success') {
          for (const area of areasResult.areas) {
            const areaNode = {
              id: `area-${area._id}`,
              type: 'area',
              label: area.name || area.code,
              data: area,
              children: []
            };

            // Load devices for this area
            try {
              const devicesResponse = await fetch(`${this.API_BASE}/areas/${area._id}/devices`);
              const devicesResult = await devicesResponse.json();

              if (devicesResult.status === 'success') {
                for (const device of devicesResult.devices) {
                  const deviceNode = {
                    id: `device-${device._id}`,
                    type: 'device',
                    label: `${device.device_id}${device.site_name ? ' - ' + device.site_name : ''}`,
                    data: device,
                    children: []
                  };

                  // Load components for this device
                  try {
                    const componentsResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/components`);
                    const componentsResult = await componentsResponse.json();

                    if (componentsResult.status === 'success') {
                      // Add inverters
                      if (componentsResult.components.inverters) {
                        componentsResult.components.inverters.forEach(inv => {
                          deviceNode.children.push({
                            id: `inverter-${device.device_id}-${inv.id}`,
                            type: 'inverter',
                            label: `Inverter-${inv.id}`,
                            data: inv
                          });
                        });
                      }

                      // Add meters
                      if (componentsResult.components.meters) {
                        componentsResult.components.meters.forEach((meter, idx) => {
                          deviceNode.children.push({
                            id: `meter-${device.device_id}-${idx}`,
                            type: 'meter',
                            label: `Meter-${idx + 1}`,
                            data: meter
                          });
                        });
                      }

                      // Add batteries
                      if (componentsResult.components.batteries) {
                        componentsResult.components.batteries.forEach((battery, idx) => {
                          deviceNode.children.push({
                            id: `battery-${device.device_id}-${idx}`,
                            type: 'battery',
                            label: `Battery-${idx + 1}`,
                            data: battery
                          });
                        });
                      }
                    }
                  } catch (error) {
                    console.error(`Error loading components for ${device.device_id}:`, error);
                  }

                  areaNode.children.push(deviceNode);
                }
              }
            } catch (error) {
              console.error(`Error loading devices for area ${area._id}:`, error);
            }

            projectNode.children.push(areaNode);
          }
        }
      } catch (error) {
        console.error(`Error loading areas for project ${project._id}:`, error);
      }

      tree.push(projectNode);
    }

    return tree;
  }

  renderTree(container, nodes, level = 0) {
    if (!nodes || nodes.length === 0) {
      container.innerHTML = '<div class="loading">Không có dữ liệu</div>';
      return;
    }

    container.innerHTML = '';

    nodes.forEach(node => {
      const nodeElement = this.createNodeElement(node, level);
      container.appendChild(nodeElement);
    });
  }

  createNodeElement(node, level) {
    const div = document.createElement('div');
    div.className = `tree-node ${node.children && node.children.length > 0 ? '' : 'leaf'}`;
    div.dataset.nodeId = node.id;

    const header = document.createElement('div');
    header.className = 'tree-node-header';
    header.style.paddingLeft = `${level * 16}px`;

    if (node.children && node.children.length > 0) {
      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle';
      toggle.textContent = '▼';
      toggle.onclick = (e) => {
        e.stopPropagation();
        div.classList.toggle('expanded');
        toggle.textContent = div.classList.contains('expanded') ? '▼' : '►';
      };
      header.appendChild(toggle);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'tree-toggle';
      spacer.textContent = ' ';
      header.appendChild(spacer);
    }

    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = node.label;
    label.onclick = () => {
      this.selectNode(node, div);
    };
    header.appendChild(label);

    div.appendChild(header);

    if (node.children && node.children.length > 0) {
      const children = document.createElement('div');
      children.className = 'tree-children';
      node.children.forEach(child => {
        children.appendChild(this.createNodeElement(child, level + 1));
      });
      div.appendChild(children);
    }

    return div;
  }

  selectNode(node, element) {
    // Remove previous selection
    document.querySelectorAll('.tree-node-header.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Add selection to current
    element.querySelector('.tree-node-header').classList.add('selected');

    // Store selected device
    if (node.type === 'device') {
      this.selectedDevice = node.data;
      // Trigger event for other components
      window.dispatchEvent(new CustomEvent('deviceSelected', { detail: node.data }));
    }
  }

  setupSearch() {
    const searchInput = document.getElementById('deviceSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      this.filterTree(query);
    });
  }

  filterTree(query) {
    if (!query) {
      this.renderTree(document.getElementById('deviceTree'), this.treeData);
      return;
    }

    const filtered = this.filterNodes(this.treeData, query);
    this.renderTree(document.getElementById('deviceTree'), filtered);
  }

  filterNodes(nodes, query) {
    const filtered = [];

    nodes.forEach(node => {
      const matches = node.label.toLowerCase().includes(query);
      const filteredChildren = node.children ? this.filterNodes(node.children, query) : [];

      if (matches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
          expanded: true
        });
      }
    });

    return filtered;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const deviceTree = new DeviceTree();
    deviceTree.init();
  });
} else {
  const deviceTree = new DeviceTree();
  deviceTree.init();
}

