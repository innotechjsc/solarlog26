/**
 * Script để chèn dữ liệu mẫu cho Projects, Areas và Devices
 * Chạy: node scripts/seed-sample-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Area = require('../models/Area');
const Device = require('../models/Device');

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin';

async function seedData() {
  try {
    console.log('Đang kết nối đến MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối thành công đến MongoDB');

    // Xóa dữ liệu cũ (tùy chọn - có thể comment lại nếu muốn giữ dữ liệu cũ)
    console.log('\nĐang xóa dữ liệu cũ...');
    await Device.deleteMany({});
    await Area.deleteMany({});
    await Project.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');

    // ==================== TẠO PROJECTS ====================
    console.log('\nĐang tạo Projects...');
    const projects = [];

    // Project 1: Nhà máy điện mặt trời Bình Thuận
    const project1 = await Project.create({
      name: 'Nhà máy điện mặt trời Bình Thuận',
      code: 'PV-BT-001',
      description: 'Dự án điện mặt trời quy mô lớn tại Bình Thuận với tổng công suất 50MW',
      location: 'Bình Thuận, Việt Nam',
      status: 'active',
      start_date: new Date('2023-01-15'),
      contact_person: {
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0912345678'
      },
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'
      }
    });
    projects.push(project1);
    console.log(`✓ Đã tạo Project: ${project1.name} (${project1.code})`);

    // Project 2: Trang trại năng lượng mặt trời Tây Ninh
    const project2 = await Project.create({
      name: 'Trang trại năng lượng mặt trời Tây Ninh',
      code: 'PV-TN-002',
      description: 'Dự án điện mặt trời nông nghiệp kết hợp tại Tây Ninh, công suất 30MW',
      location: 'Tây Ninh, Việt Nam',
      status: 'active',
      start_date: new Date('2023-03-20'),
      contact_person: {
        name: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '0923456789'
      },
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'
      }
    });
    projects.push(project2);
    console.log(`✓ Đã tạo Project: ${project2.name} (${project2.code})`);

    // Project 3: Hệ thống điện mặt trời áp mái Nha Trang
    const project3 = await Project.create({
      name: 'Hệ thống điện mặt trời áp mái Nha Trang',
      code: 'PV-NT-003',
      description: 'Dự án điện mặt trời áp mái cho các tòa nhà thương mại tại Nha Trang, tổng công suất 5MW',
      location: 'Nha Trang, Khánh Hòa, Việt Nam',
      status: 'active',
      start_date: new Date('2023-06-10'),
      contact_person: {
        name: 'Lê Văn C',
        email: 'levanc@example.com',
        phone: '0934567890'
      },
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'
      }
    });
    projects.push(project3);
    console.log(`✓ Đã tạo Project: ${project3.name} (${project3.code})`);

    // Project 4: Nhà máy điện mặt trời Long An
    const project4 = await Project.create({
      name: 'Nhà máy điện mặt trời Long An',
      code: 'PV-LA-004',
      description: 'Dự án điện mặt trời tại Long An với công suất 40MW',
      location: 'Long An, Việt Nam',
      status: 'active',
      start_date: new Date('2023-08-05'),
      contact_person: {
        name: 'Phạm Thị D',
        email: 'phamthid@example.com',
        phone: '0945678901'
      },
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'
      }
    });
    projects.push(project4);
    console.log(`✓ Đã tạo Project: ${project4.name} (${project4.code})`);

    // ==================== TẠO AREAS ====================
    console.log('\nĐang tạo Areas...');
    const areas = [];

    // Areas cho Project 1 (Bình Thuận)
    const area1_1 = await Area.create({
      name: 'Khu vực A - Mảng 1',
      code: 'A-01',
      project_id: project1._id,
      description: 'Khu vực A - Mảng 1 của nhà máy Bình Thuận',
      location: 'Bình Thuận - Khu A',
      coordinates: {
        latitude: 10.8231,
        longitude: 108.2999
      },
      status: 'active',
      capacity: 12500, // 12.5 MW
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area1_1);
    console.log(`✓ Đã tạo Area: ${area1_1.name} cho Project ${project1.code}`);

    const area1_2 = await Area.create({
      name: 'Khu vực A - Mảng 2',
      code: 'A-02',
      project_id: project1._id,
      description: 'Khu vực A - Mảng 2 của nhà máy Bình Thuận',
      location: 'Bình Thuận - Khu A',
      coordinates: {
        latitude: 10.8241,
        longitude: 108.3009
      },
      status: 'active',
      capacity: 12500,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area1_2);
    console.log(`✓ Đã tạo Area: ${area1_2.name} cho Project ${project1.code}`);

    const area1_3 = await Area.create({
      name: 'Khu vực B - Mảng 1',
      code: 'B-01',
      project_id: project1._id,
      description: 'Khu vực B - Mảng 1 của nhà máy Bình Thuận',
      location: 'Bình Thuận - Khu B',
      coordinates: {
        latitude: 10.8251,
        longitude: 108.3019
      },
      status: 'active',
      capacity: 12500,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area1_3);
    console.log(`✓ Đã tạo Area: ${area1_3.name} cho Project ${project1.code}`);

    const area1_4 = await Area.create({
      name: 'Khu vực B - Mảng 2',
      code: 'B-02',
      project_id: project1._id,
      description: 'Khu vực B - Mảng 2 của nhà máy Bình Thuận',
      location: 'Bình Thuận - Khu B',
      coordinates: {
        latitude: 10.8261,
        longitude: 108.3029
      },
      status: 'active',
      capacity: 12500,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area1_4);
    console.log(`✓ Đã tạo Area: ${area1_4.name} cho Project ${project1.code}`);

    // Areas cho Project 2 (Tây Ninh)
    const area2_1 = await Area.create({
      name: 'Khu vực 1 - Phía Đông',
      code: 'EAST-01',
      project_id: project2._id,
      description: 'Khu vực phía Đông của trang trại Tây Ninh',
      location: 'Tây Ninh - Phía Đông',
      coordinates: {
        latitude: 11.3133,
        longitude: 106.0963
      },
      status: 'active',
      capacity: 10000,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area2_1);
    console.log(`✓ Đã tạo Area: ${area2_1.name} cho Project ${project2.code}`);

    const area2_2 = await Area.create({
      name: 'Khu vực 2 - Phía Tây',
      code: 'WEST-01',
      project_id: project2._id,
      description: 'Khu vực phía Tây của trang trại Tây Ninh',
      location: 'Tây Ninh - Phía Tây',
      coordinates: {
        latitude: 11.3143,
        longitude: 106.0973
      },
      status: 'active',
      capacity: 10000,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area2_2);
    console.log(`✓ Đã tạo Area: ${area2_2.name} cho Project ${project2.code}`);

    const area2_3 = await Area.create({
      name: 'Khu vực 3 - Phía Nam',
      code: 'SOUTH-01',
      project_id: project2._id,
      description: 'Khu vực phía Nam của trang trại Tây Ninh',
      location: 'Tây Ninh - Phía Nam',
      coordinates: {
        latitude: 11.3153,
        longitude: 106.0983
      },
      status: 'active',
      capacity: 10000,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area2_3);
    console.log(`✓ Đã tạo Area: ${area2_3.name} cho Project ${project2.code}`);

    // Areas cho Project 3 (Nha Trang)
    const area3_1 = await Area.create({
      name: 'Tòa nhà Thương mại A',
      code: 'BUILD-A',
      project_id: project3._id,
      description: 'Hệ thống điện mặt trời trên mái tòa nhà thương mại A',
      location: 'Nha Trang - Đường Trần Phú',
      coordinates: {
        latitude: 12.2388,
        longitude: 109.1967
      },
      status: 'active',
      capacity: 1500,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area3_1);
    console.log(`✓ Đã tạo Area: ${area3_1.name} cho Project ${project3.code}`);

    const area3_2 = await Area.create({
      name: 'Tòa nhà Thương mại B',
      code: 'BUILD-B',
      project_id: project3._id,
      description: 'Hệ thống điện mặt trời trên mái tòa nhà thương mại B',
      location: 'Nha Trang - Đường Nguyễn Thiện Thuật',
      coordinates: {
        latitude: 12.2398,
        longitude: 109.1977
      },
      status: 'active',
      capacity: 1500,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area3_2);
    console.log(`✓ Đã tạo Area: ${area3_2.name} cho Project ${project3.code}`);

    const area3_3 = await Area.create({
      name: 'Tòa nhà Văn phòng C',
      code: 'BUILD-C',
      project_id: project3._id,
      description: 'Hệ thống điện mặt trời trên mái tòa nhà văn phòng C',
      location: 'Nha Trang - Đường Thái Nguyên',
      coordinates: {
        latitude: 12.2408,
        longitude: 109.1987
      },
      status: 'active',
      capacity: 1000,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area3_3);
    console.log(`✓ Đã tạo Area: ${area3_3.name} cho Project ${project3.code}`);

    const area3_4 = await Area.create({
      name: 'Trung tâm Thương mại D',
      code: 'BUILD-D',
      project_id: project3._id,
      description: 'Hệ thống điện mặt trời trên mái trung tâm thương mại D',
      location: 'Nha Trang - Đường Trần Quang Khải',
      coordinates: {
        latitude: 12.2418,
        longitude: 109.1997
      },
      status: 'active',
      capacity: 1000,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area3_4);
    console.log(`✓ Đã tạo Area: ${area3_4.name} cho Project ${project3.code}`);

    // Areas cho Project 4 (Long An)
    const area4_1 = await Area.create({
      name: 'Khu vực 1',
      code: 'ZONE-01',
      project_id: project4._id,
      description: 'Khu vực 1 của nhà máy Long An',
      location: 'Long An - Huyện Đức Hòa',
      coordinates: {
        latitude: 10.8770,
        longitude: 106.4246
      },
      status: 'active',
      capacity: 13333,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area4_1);
    console.log(`✓ Đã tạo Area: ${area4_1.name} cho Project ${project4.code}`);

    const area4_2 = await Area.create({
      name: 'Khu vực 2',
      code: 'ZONE-02',
      project_id: project4._id,
      description: 'Khu vực 2 của nhà máy Long An',
      location: 'Long An - Huyện Đức Hòa',
      coordinates: {
        latitude: 10.8780,
        longitude: 106.4256
      },
      status: 'active',
      capacity: 13333,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area4_2);
    console.log(`✓ Đã tạo Area: ${area4_2.name} cho Project ${project4.code}`);

    const area4_3 = await Area.create({
      name: 'Khu vực 3',
      code: 'ZONE-03',
      project_id: project4._id,
      description: 'Khu vực 3 của nhà máy Long An',
      location: 'Long An - Huyện Đức Hòa',
      coordinates: {
        latitude: 10.8790,
        longitude: 106.4266
      },
      status: 'active',
      capacity: 13334,
      settings: {
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });
    areas.push(area4_3);
    console.log(`✓ Đã tạo Area: ${area4_3.name} cho Project ${project4.code}`);

    // ==================== TẠO DEVICES ====================
    console.log('\nĐang tạo Devices...');
    let deviceCount = 0;

    // Tạo hàm helper để tạo device
    const createDevice = async (deviceId, area, project, siteName, location, status, inverters) => {
      const device = await Device.create({
        device_id: deviceId,
        project_id: project._id,
        area_id: area._id,
        site_name: siteName,
        location: location,
        timezone: 'Asia/Ho_Chi_Minh',
        version: '0.9.0',
        total_inverters: inverters,
        status: status,
        last_seen: status === 'online' ? new Date() : new Date(Date.now() - 3600000), // offline 1 giờ trước
        metadata: {
          installation_date: new Date('2023-01-01'),
          warranty_expiry: new Date('2028-01-01'),
          notes: `Thiết bị tại ${siteName}`
        }
      });
      deviceCount++;
      console.log(`✓ Đã tạo Device: ${deviceId} - ${siteName} (${status})`);
      return device;
    };

    // Devices cho Project 1 - Area 1_1
    await createDevice('SL-BT-A01-001', area1_1, project1, 'Trạm biến áp A01-001', 'Bình Thuận - Khu A - Mảng 1', 'online', 8);
    await createDevice('SL-BT-A01-002', area1_1, project1, 'Trạm biến áp A01-002', 'Bình Thuận - Khu A - Mảng 1', 'online', 8);
    await createDevice('SL-BT-A01-003', area1_1, project1, 'Trạm biến áp A01-003', 'Bình Thuận - Khu A - Mảng 1', 'online', 6);

    // Devices cho Project 1 - Area 1_2
    await createDevice('SL-BT-A02-001', area1_2, project1, 'Trạm biến áp A02-001', 'Bình Thuận - Khu A - Mảng 2', 'online', 8);
    await createDevice('SL-BT-A02-002', area1_2, project1, 'Trạm biến áp A02-002', 'Bình Thuận - Khu A - Mảng 2', 'online', 8);
    await createDevice('SL-BT-A02-003', area1_2, project1, 'Trạm biến áp A02-003', 'Bình Thuận - Khu A - Mảng 2', 'offline', 6);

    // Devices cho Project 1 - Area 1_3
    await createDevice('SL-BT-B01-001', area1_3, project1, 'Trạm biến áp B01-001', 'Bình Thuận - Khu B - Mảng 1', 'online', 8);
    await createDevice('SL-BT-B01-002', area1_3, project1, 'Trạm biến áp B01-002', 'Bình Thuận - Khu B - Mảng 1', 'online', 8);
    await createDevice('SL-BT-B01-003', area1_3, project1, 'Trạm biến áp B01-003', 'Bình Thuận - Khu B - Mảng 1', 'online', 6);

    // Devices cho Project 1 - Area 1_4
    await createDevice('SL-BT-B02-001', area1_4, project1, 'Trạm biến áp B02-001', 'Bình Thuận - Khu B - Mảng 2', 'online', 8);
    await createDevice('SL-BT-B02-002', area1_4, project1, 'Trạm biến áp B02-002', 'Bình Thuận - Khu B - Mảng 2', 'online', 8);
    await createDevice('SL-BT-B02-003', area1_4, project1, 'Trạm biến áp B02-003', 'Bình Thuận - Khu B - Mảng 2', 'offline', 6);

    // Devices cho Project 2 - Area 2_1
    await createDevice('SL-TN-EAST-001', area2_1, project2, 'Trạm Đông 001', 'Tây Ninh - Phía Đông', 'online', 6);
    await createDevice('SL-TN-EAST-002', area2_1, project2, 'Trạm Đông 002', 'Tây Ninh - Phía Đông', 'online', 6);
    await createDevice('SL-TN-EAST-003', area2_1, project2, 'Trạm Đông 003', 'Tây Ninh - Phía Đông', 'online', 4);

    // Devices cho Project 2 - Area 2_2
    await createDevice('SL-TN-WEST-001', area2_2, project2, 'Trạm Tây 001', 'Tây Ninh - Phía Tây', 'online', 6);
    await createDevice('SL-TN-WEST-002', area2_2, project2, 'Trạm Tây 002', 'Tây Ninh - Phía Tây', 'online', 6);
    await createDevice('SL-TN-WEST-003', area2_2, project2, 'Trạm Tây 003', 'Tây Ninh - Phía Tây', 'offline', 4);

    // Devices cho Project 2 - Area 2_3
    await createDevice('SL-TN-SOUTH-001', area2_3, project2, 'Trạm Nam 001', 'Tây Ninh - Phía Nam', 'online', 6);
    await createDevice('SL-TN-SOUTH-002', area2_3, project2, 'Trạm Nam 002', 'Tây Ninh - Phía Nam', 'online', 6);
    await createDevice('SL-TN-SOUTH-003', area2_3, project2, 'Trạm Nam 003', 'Tây Ninh - Phía Nam', 'online', 4);

    // Devices cho Project 3 - Area 3_1
    await createDevice('SL-NT-A-001', area3_1, project3, 'Tòa nhà A - Hệ thống 1', 'Nha Trang - Tòa nhà A', 'online', 4);
    await createDevice('SL-NT-A-002', area3_1, project3, 'Tòa nhà A - Hệ thống 2', 'Nha Trang - Tòa nhà A', 'online', 4);

    // Devices cho Project 3 - Area 3_2
    await createDevice('SL-NT-B-001', area3_2, project3, 'Tòa nhà B - Hệ thống 1', 'Nha Trang - Tòa nhà B', 'online', 4);
    await createDevice('SL-NT-B-002', area3_2, project3, 'Tòa nhà B - Hệ thống 2', 'Nha Trang - Tòa nhà B', 'online', 3);

    // Devices cho Project 3 - Area 3_3
    await createDevice('SL-NT-C-001', area3_3, project3, 'Tòa nhà C - Hệ thống 1', 'Nha Trang - Tòa nhà C', 'online', 3);
    await createDevice('SL-NT-C-002', area3_3, project3, 'Tòa nhà C - Hệ thống 2', 'Nha Trang - Tòa nhà C', 'offline', 3);

    // Devices cho Project 3 - Area 3_4
    await createDevice('SL-NT-D-001', area3_4, project3, 'Trung tâm D - Hệ thống 1', 'Nha Trang - Trung tâm D', 'online', 3);
    await createDevice('SL-NT-D-002', area3_4, project3, 'Trung tâm D - Hệ thống 2', 'Nha Trang - Trung tâm D', 'online', 2);

    // Devices cho Project 4 - Area 4_1
    await createDevice('SL-LA-Z01-001', area4_1, project4, 'Khu vực 1 - Trạm 001', 'Long An - Khu vực 1', 'online', 8);
    await createDevice('SL-LA-Z01-002', area4_1, project4, 'Khu vực 1 - Trạm 002', 'Long An - Khu vực 1', 'online', 8);
    await createDevice('SL-LA-Z01-003', area4_1, project4, 'Khu vực 1 - Trạm 003', 'Long An - Khu vực 1', 'online', 6);

    // Devices cho Project 4 - Area 4_2
    await createDevice('SL-LA-Z02-001', area4_2, project4, 'Khu vực 2 - Trạm 001', 'Long An - Khu vực 2', 'online', 8);
    await createDevice('SL-LA-Z02-002', area4_2, project4, 'Khu vực 2 - Trạm 002', 'Long An - Khu vực 2', 'online', 8);
    await createDevice('SL-LA-Z02-003', area4_2, project4, 'Khu vực 2 - Trạm 003', 'Long An - Khu vực 2', 'offline', 6);

    // Devices cho Project 4 - Area 4_3
    await createDevice('SL-LA-Z03-001', area4_3, project4, 'Khu vực 3 - Trạm 001', 'Long An - Khu vực 3', 'online', 8);
    await createDevice('SL-LA-Z03-002', area4_3, project4, 'Khu vực 3 - Trạm 002', 'Long An - Khu vực 3', 'online', 8);
    await createDevice('SL-LA-Z03-003', area4_3, project4, 'Khu vực 3 - Trạm 003', 'Long An - Khu vực 3', 'online', 6);

    // ==================== TỔNG KẾT ====================
    console.log('\n' + '='.repeat(60));
    console.log('HOÀN TẤT CHÈN DỮ LIỆU MẪU');
    console.log('='.repeat(60));
    console.log(`✓ Tổng số Projects: ${projects.length}`);
    console.log(`✓ Tổng số Areas: ${areas.length}`);
    console.log(`✓ Tổng số Devices: ${deviceCount}`);
    console.log('\nChi tiết:');
    
    for (const project of projects) {
      const projectAreas = await Area.countDocuments({ project_id: project._id });
      const projectDevices = await Device.countDocuments({ project_id: project._id });
      const onlineDevices = await Device.countDocuments({ 
        project_id: project._id, 
        status: 'online' 
      });
      
      console.log(`\n📁 ${project.name} (${project.code}):`);
      console.log(`   - Areas: ${projectAreas}`);
      console.log(`   - Devices: ${projectDevices} (Online: ${onlineDevices}, Offline: ${projectDevices - onlineDevices})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Dữ liệu mẫu đã được chèn thành công!');
    console.log('Bạn có thể truy cập Dashboard để xem thông tin.');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\nĐã ngắt kết nối MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Lỗi khi chèn dữ liệu:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
seedData();





