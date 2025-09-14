
import prisma from '../config/database.js';
import { CreateOrderRequest, PaginationParams, DashboardStats, RevenueData, FishSalesData, PaginatedResponse } from '../types/index.js';
import { Decimal } from '@prisma/client/runtime/library';
import type { BlogPost, Order, OrderItem, User, FishType, WeatherForecast } from '@prisma/client';

export class DatabaseService {
  // Order operations with proper error handling
  async createOrder(orderData: CreateOrderRequest) {
    const { orderItems, ...orderInfo } = orderData;
    
    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantityKg * item.unitPrice), 0);

    const result = await prisma.$transaction(async (tx) => {
      // Create the main order
      const order = await tx.order.create({
        data: {
          ...orderInfo,
          deliveryDate: new Date(orderInfo.deliveryDate),
          totalAmount: new Decimal(totalAmount),
          deliveryLatitude: new Decimal(orderInfo.deliveryLatitude),
          deliveryLongitude: new Decimal(orderInfo.deliveryLongitude),
          status: 'pending'
        }
      });

      // Create order items
      const items = await Promise.all(
        orderItems.map(item =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              fishTypeId: item.fishTypeId,
              quantityKg: new Decimal(item.quantityKg),
              unitPrice: new Decimal(item.unitPrice),
              subtotal: new Decimal(item.quantityKg * item.unitPrice)
            }
          })
        )
      );

      // Create initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'pending',
          notes: 'Order created'
        }
      });

      return { order, items };
    });

    return result;
  }

  async getOrderById(id: number) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            fishType: true
          }
        },
        user: true,
        pickupHarbor: true,
        assignedTruck: {
          include: {
            driver: true
          }
        },
        statusHistory: {
          orderBy: { statusDate: 'desc' }
        }
      }
    });
  }

  async getPendingOrders(pagination: PaginationParams): Promise<PaginatedResponse<Order & { orderItems: (OrderItem & { fishType: FishType })[], user: User }>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'pending' },
        include: {
          orderItems: {
            include: {
              fishType: true
            }
          },
          user: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { status: 'pending' } })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getLatestTransactions(pagination: PaginationParams): Promise<PaginatedResponse<Order & { orderItems: (OrderItem & { fishType: FishType })[], user: User }>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: { in: ['delivered', 'completed'] }
        },
        include: {
          orderItems: {
            include: {
              fishType: true
            }
          },
          user: true
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: { status: { in: ['delivered', 'completed'] } }
      })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Fish type operations
  async getAllFishTypes(): Promise<FishType[]> {
    return await prisma.fishType.findMany({
      where: { isActive: true },
      orderBy: { fishName: 'asc' }
    });
  }

  // Pricing operations with safe array access
  async getFishPricesHistory(fishTypeId?: number, days: number = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const where = {
      priceDate: { gte: dateFrom },
      ...(fishTypeId && { fishTypeId })
    };

    return await prisma.fishPricing.findMany({
      where,
      include: {
        fishType: true
      },
      orderBy: { priceDate: 'desc' }
    });
  }

  async addFishPrice(data: {
    fishTypeId: number;
    priceDate: Date;
    retailPrice: number;
    wholesalePrice: number;
    marketDemandLevel?: string;
    supplyAvailability?: number;
    isActual: boolean;
  }) {
    return await prisma.fishPricing.create({
      data: {
        ...data,
        retailPrice: new Decimal(data.retailPrice),
        wholesalePrice: new Decimal(data.wholesalePrice),
        isActual: true
      }
    });
  }

  // Fixed Dashboard analytics with proper null checking
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total revenue and growth with null safety
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: {
          status: { in: ['delivered', 'completed'] },
          createdAt: { gte: currentMonthStart }
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['delivered', 'completed'] },
          createdAt: { gte: lastMonth, lt: currentMonthStart }
        },
        _sum: { totalAmount: true }
      })
    ]);

    const totalRevenue = Number(currentRevenue._sum.totalAmount ?? 0);
    const prevRevenue = Number(previousRevenue._sum.totalAmount ?? 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // New customers this month
    const newCustomers = await prisma.user.count({
      where: {
        createdAt: { gte: currentMonthStart }
      }
    });

    // Active accounts (users who placed orders in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [activeAccounts, previousActiveAccounts] = await Promise.all([
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: thirtyDaysAgo }
            }
          }
        }
      })
    ]);

    const activeAccountsGrowth = previousActiveAccounts > 0 ? 
      ((activeAccounts - previousActiveAccounts) / previousActiveAccounts) * 100 : 0;

    // Ongoing trucks
    const ongoingTrucks = await prisma.truck.count({
      where: {
        availabilityStatus: 'in_transit'
      }
    });

    return {
      totalRevenue,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      newCustomers,
      activeAccounts,
      activeAccountsGrowth: Number(activeAccountsGrowth.toFixed(2)),
      ongoingTrucks
    };
  }

  // Fixed revenue data with proper array bounds checking
  async getRevenueData(): Promise<RevenueData[]> {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const revenueData = await prisma.$queryRaw<Array<{
      month: number;
      current_year: bigint | null;
      previous_year: bigint | null;
    }>>`
      WITH monthly_revenue AS (
        SELECT 
          EXTRACT(MONTH FROM created_at) as month,
          EXTRACT(YEAR FROM created_at) as year,
          SUM(total_amount) as revenue
        FROM orders 
        WHERE 
          status IN ('delivered', 'completed')
          AND EXTRACT(YEAR FROM created_at) IN (${currentYear}, ${previousYear})
        GROUP BY EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at)
      )
      SELECT 
        m.month,
        COALESCE(curr.revenue, 0) as current_year,
        COALESCE(prev.revenue, 0) as previous_year
      FROM generate_series(1, 12) as m(month)
      LEFT JOIN monthly_revenue curr ON m.month = curr.month AND curr.year = ${currentYear}
      LEFT JOIN monthly_revenue prev ON m.month = prev.month AND prev.year = ${previousYear}
      ORDER BY m.month;
    `;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return revenueData.map(row => {
      const monthIndex = row.month - 1;
      const monthName = months[monthIndex];
      
      // Safe array access and null checking
      if (!monthName) {
        throw new Error(`Invalid month index: ${monthIndex}`);
      }

      return {
        month: monthName,
        currentYear: Number(row.current_year ?? 0),
        previousYear: Number(row.previous_year ?? 0)
      };
    });
  }

  // Fixed fish sales data with proper array bounds checking
  async getFishSalesData(): Promise<FishSalesData[]> {
    const currentYear = new Date().getFullYear();
    
    const salesData = await prisma.$queryRaw<Array<{
      month: number;
      total_sales: bigint | null;
    }>>`
      SELECT 
        EXTRACT(MONTH FROM o.created_at) as month,
        SUM(oi.quantity_kg) as total_sales
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE 
        o.status IN ('delivered', 'completed')
        AND EXTRACT(YEAR FROM o.created_at) = ${currentYear}
      GROUP BY EXTRACT(MONTH FROM o.created_at)
      ORDER BY month;
    `;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Fill missing months with 0 and ensure safe array access
    const result: FishSalesData[] = [];
    for (let i = 1; i <= 12; i++) {
      const monthData = salesData.find(row => row.month === i);
      const monthIndex = i - 1;
      const monthName = months[monthIndex];
      
      if (!monthName) {
        throw new Error(`Invalid month index: ${monthIndex}`);
      }

      result.push({
        month: monthName,
        sales: monthData ? Number(monthData.total_sales ?? 0) : 0
      });
    }

    return result;
  }

  // Blog operations with proper typing
  async getAllBlogPosts(category?: string, pagination?: PaginationParams): Promise<BlogPost[] | PaginatedResponse<BlogPost>> {
    const where = {
      isPublished: true,
      ...(category && { category })
    };

    if (!pagination) {
      return await prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' }
      });
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const post = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (post) {
      // Increment read count
      await prisma.blogPost.update({
        where: { slug },
        data: { readCount: { increment: 1 } }
      });
    }

    return post;
  }

  // User operations
  async getAllUsers(pagination: PaginationParams): Promise<PaginatedResponse<User>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: { isActive: true } })
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  }

  // Weather operations
  async getWeatherForecasts(location?: string, days: number = 7): Promise<WeatherForecast[]> {
    const dateFrom = new Date();
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + days);

    const where = {
      forecastDate: {
        gte: dateFrom,
        lte: dateTo
      },
      ...(location && { location })
    };

    return await prisma.weatherForecast.findMany({
      where,
      orderBy: { forecastDate: 'asc' }
    });
  }

  // Additional required methods for complete functionality
  async getTruckInfo() {
    return await prisma.truck.findMany({
      where: {
        availabilityStatus: { in: ['available', 'in_transit', 'maintenance'] }
      },
      include: {
        driver: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getOrdersByStatus(status: string[], pagination: PaginationParams) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: status } },
        include: {
          orderItems: {
            include: {
              fishType: true
            }
          },
          user: true,
          assignedTruck: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { status: { in: status } } })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}