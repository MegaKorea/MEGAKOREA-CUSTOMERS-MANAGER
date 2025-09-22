import databaseService from './database.services'

class ReportAdsServices {
  async CreateReportAds(body: any) {
    const { date, report } = body
    const isExsitReport = await databaseService.report_ads.findOne({ date })
    if (isExsitReport) {
      await databaseService.report_ads.updateOne(
        {
          date
        },
        {
          $set: {
            report: report
          }
        }
      )
    } else {
      await databaseService.report_ads.insertOne(body)
    }
  }
  async GetReportAds(date: string) {
    let dateArr: string[] = []
    let match: any = {}

    if (date?.includes('*')) {
      dateArr = (date as string).split('*')
      match = {
        date: {
          $gte: dateArr[0],
          $lte: dateArr[1]
        }
      }
    } else {
      match = {
        date: date
      }
    }

    return await databaseService.report_ads
      .aggregate([
        {
          $match: match
        }
      ])
      .toArray()
  }

  async GetReportAdsRangeDate(date: string[]) {
    const match = {
      date: {
        $gte: date[0],
        $lte: date[1]
      }
    }

    return await databaseService.report_ads
      .aggregate([
        {
          $match: match
        },
        {
          $unwind: '$report'
        },
        {
          $group: {
            _id: '$report.key',
            branch: { $first: '$report.branch' },
            total_customers: { $sum: '$report.total_customers' },
            customers_success: { $sum: '$report.customers_success' },
            customers_not_contacted: { $sum: '$report.customers_not_contacted' },
            customer_arrive: { $sum: '$report.customer_arrive' },
            spend: { $sum: '$report.spend' },
            interact: { $sum: '$report.interact' },
            totalRevenue: { $sum: '$report.totalRevenue' },
            otherRevenue: { $sum: '$report.otherRevenue' },
            oldCustomerRevenue: { $sum: '$report.oldCustomerRevenue' },
            newCustomerRevenue: { $sum: '$report.newCustomerRevenue' },
            children: {
              $push: {
                $map: {
                  input: '$report.children',
                  as: 'child',
                  in: {
                    originalKey: '$$child.key', // Lưu key gốc tạm thời để xử lý
                    _id: '$$child._id',
                    branch: '$$child.branch',
                    total_customers: '$$child.total_customers',
                    customers_success: '$$child.customers_success',
                    customers_not_contacted: '$$child.customers_not_contacted',
                    customer_arrive: '$$child.customer_arrive',
                    spend: '$$child.spend',
                    interact: '$$child.interact',
                    totalRevenue: '$$child.totalRevenue',
                    otherRevenue: '$$child.otherRevenue',
                    precents_customer_success: '$$child.precents_customer_success',
                    precent_customer_not_contacted: '$$child.precent_customer_not_contacted',
                    precents_customer_arrive: '$$child.precents_customer_arrive'
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            key: '$_id',
            branch: 1,
            total_customers: 1,
            customers_success: 1,
            customers_not_contacted: 1,
            customer_arrive: 1,
            spend: 1,
            interact: 1,
            totalRevenue: 1,
            otherRevenue: 1,
            oldCustomerRevenue: 1,
            newCustomerRevenue: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            },
            children: {
              $reduce: {
                input: '$children',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] }
              }
            }
          }
        },
        {
          $addFields: {
            children: {
              $map: {
                input: {
                  $setUnion: [
                    {
                      $map: {
                        input: '$children',
                        as: 'child',
                        in: {
                          $let: {
                            vars: {
                              splitKey: { $split: ['$$child.originalKey', '-'] }
                            },
                            in: {
                              $concat: [{ $arrayElemAt: ['$$splitKey', 0] }, '-', { $arrayElemAt: ['$$splitKey', 1] }]
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                as: 'uniqueChildKey',
                in: {
                  key: '$$uniqueChildKey', // Chỉ sử dụng key mới
                  _id: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: '$children',
                              as: 'child',
                              cond: {
                                $eq: [
                                  {
                                    $let: {
                                      vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                      in: {
                                        $concat: [
                                          { $arrayElemAt: ['$$splitKey', 0] },
                                          '-',
                                          { $arrayElemAt: ['$$splitKey', 1] }
                                        ]
                                      }
                                    }
                                  },
                                  '$$uniqueChildKey'
                                ]
                              }
                            }
                          },
                          in: '$$this._id'
                        }
                      },
                      0
                    ]
                  },
                  branch: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: '$children',
                              as: 'child',
                              cond: {
                                $eq: [
                                  {
                                    $let: {
                                      vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                      in: {
                                        $concat: [
                                          { $arrayElemAt: ['$$splitKey', 0] },
                                          '-',
                                          { $arrayElemAt: ['$$splitKey', 1] }
                                        ]
                                      }
                                    }
                                  },
                                  '$$uniqueChildKey'
                                ]
                              }
                            }
                          },
                          in: '$$this.branch'
                        }
                      },
                      0
                    ]
                  },
                  total_customers: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.total_customers'
                      }
                    }
                  },
                  customers_success: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.customers_success'
                      }
                    }
                  },
                  customers_not_contacted: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.customers_not_contacted'
                      }
                    }
                  },
                  customer_arrive: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.customer_arrive'
                      }
                    }
                  },
                  spend: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.spend'
                      }
                    }
                  },
                  interact: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.interact'
                      }
                    }
                  },
                  totalRevenue: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.totalRevenue'
                      }
                    }
                  },
                  otherRevenue: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$children',
                            as: 'child',
                            cond: {
                              $eq: [
                                {
                                  $let: {
                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                    in: {
                                      $concat: [
                                        { $arrayElemAt: ['$$splitKey', 0] },
                                        '-',
                                        { $arrayElemAt: ['$$splitKey', 1] }
                                      ]
                                    }
                                  }
                                },
                                '$$uniqueChildKey'
                              ]
                            }
                          }
                        },
                        in: '$$this.otherRevenue'
                      }
                    }
                  },
                  precents_customer_success: {
                    $let: {
                      vars: {
                        totalCustomers: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: '$children',
                                  as: 'child',
                                  cond: {
                                    $eq: [
                                      {
                                        $let: {
                                          vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                          in: {
                                            $concat: [
                                              { $arrayElemAt: ['$$splitKey', 0] },
                                              '-',
                                              { $arrayElemAt: ['$$splitKey', 1] }
                                            ]
                                          }
                                        }
                                      },
                                      '$$uniqueChildKey'
                                    ]
                                  }
                                }
                              },
                              in: '$$this.total_customers'
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          { $eq: ['$$totalCustomers', 0] },
                          0,
                          {
                            $multiply: [
                              {
                                $divide: [
                                  {
                                    $sum: {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: '$children',
                                            as: 'child',
                                            cond: {
                                              $eq: [
                                                {
                                                  $let: {
                                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                                    in: {
                                                      $concat: [
                                                        { $arrayElemAt: ['$$splitKey', 0] },
                                                        '-',
                                                        { $arrayElemAt: ['$$splitKey', 1] }
                                                      ]
                                                    }
                                                  }
                                                },
                                                '$$uniqueChildKey'
                                              ]
                                            }
                                          }
                                        },
                                        in: '$$this.customers_success'
                                      }
                                    }
                                  },
                                  '$$totalCustomers'
                                ]
                              },
                              100
                            ]
                          }
                        ]
                      }
                    }
                  },
                  precent_customer_not_contacted: {
                    $let: {
                      vars: {
                        totalCustomers: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: '$children',
                                  as: 'child',
                                  cond: {
                                    $eq: [
                                      {
                                        $let: {
                                          vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                          in: {
                                            $concat: [
                                              { $arrayElemAt: ['$$splitKey', 0] },
                                              '-',
                                              { $arrayElemAt: ['$$splitKey', 1] }
                                            ]
                                          }
                                        }
                                      },
                                      '$$uniqueChildKey'
                                    ]
                                  }
                                }
                              },
                              in: '$$this.total_customers'
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          { $eq: ['$$totalCustomers', 0] },
                          0,
                          {
                            $multiply: [
                              {
                                $divide: [
                                  {
                                    $sum: {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: '$children',
                                            as: 'child',
                                            cond: {
                                              $eq: [
                                                {
                                                  $let: {
                                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                                    in: {
                                                      $concat: [
                                                        { $arrayElemAt: ['$$splitKey', 0] },
                                                        '-',
                                                        { $arrayElemAt: ['$$splitKey', 1] }
                                                      ]
                                                    }
                                                  }
                                                },
                                                '$$uniqueChildKey'
                                              ]
                                            }
                                          }
                                        },
                                        in: '$$this.customers_not_contacted'
                                      }
                                    }
                                  },
                                  '$$totalCustomers'
                                ]
                              },
                              100
                            ]
                          }
                        ]
                      }
                    }
                  },
                  precents_customer_arrive: {
                    $let: {
                      vars: {
                        totalCustomers: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: '$children',
                                  as: 'child',
                                  cond: {
                                    $eq: [
                                      {
                                        $let: {
                                          vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                          in: {
                                            $concat: [
                                              { $arrayElemAt: ['$$splitKey', 0] },
                                              '-',
                                              { $arrayElemAt: ['$$splitKey', 1] }
                                            ]
                                          }
                                        }
                                      },
                                      '$$uniqueChildKey'
                                    ]
                                  }
                                }
                              },
                              in: '$$this.total_customers'
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          { $eq: ['$$totalCustomers', 0] },
                          0,
                          {
                            $multiply: [
                              {
                                $divide: [
                                  {
                                    $sum: {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: '$children',
                                            as: 'child',
                                            cond: {
                                              $eq: [
                                                {
                                                  $let: {
                                                    vars: { splitKey: { $split: ['$$child.originalKey', '-'] } },
                                                    in: {
                                                      $concat: [
                                                        { $arrayElemAt: ['$$splitKey', 0] },
                                                        '-',
                                                        { $arrayElemAt: ['$$splitKey', 1] }
                                                      ]
                                                    }
                                                  }
                                                },
                                                '$$uniqueChildKey'
                                              ]
                                            }
                                          }
                                        },
                                        in: '$$this.customer_arrive'
                                      }
                                    }
                                  },
                                  '$$totalCustomers'
                                ]
                              },
                              100
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $sort: { branch: 1 }
        }
      ])
      .toArray()
  }

  async getMonthlyReport(year = 2025) {
    const pipeline = [
      {
        $match: {
          date: {
            $gte: `${year}-01-01`,
            $lte: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-31`
          }
        }
      },

      // 2. Unwind array report để xử lý từng object riêng biệt
      {
        $unwind: '$report'
      },

      // 3. Add field để extract tháng từ date
      {
        $addFields: {
          month: { $toInt: { $substr: ['$date', 5, 2] } }
        }
      },

      // 4. Group theo tháng và tính tổng spend, totalRevenue
      {
        $group: {
          _id: '$month',
          totalSpend: {
            $sum: {
              $toDouble: { $ifNull: ['$report.spend', 0] }
            }
          },
          totalRevenue: {
            $sum: {
              $toDouble: { $ifNull: ['$report.totalRevenue', 0] }
            }
          }
        }
      },

      // 5. Sort theo tháng
      {
        $sort: { _id: 1 }
      },

      // 6. Project để format output theo yêu cầu
      {
        $project: {
          _id: 0,
          month: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 1] }, then: 'january' },
                { case: { $eq: ['$_id', 2] }, then: 'february' },
                { case: { $eq: ['$_id', 3] }, then: 'march' },
                { case: { $eq: ['$_id', 4] }, then: 'april' },
                { case: { $eq: ['$_id', 5] }, then: 'may' },
                { case: { $eq: ['$_id', 6] }, then: 'june' },
                { case: { $eq: ['$_id', 7] }, then: 'july' },
                { case: { $eq: ['$_id', 8] }, then: 'august' },
                { case: { $eq: ['$_id', 9] }, then: 'september' },
                { case: { $eq: ['$_id', 10] }, then: 'october' },
                { case: { $eq: ['$_id', 11] }, then: 'november' },
                { case: { $eq: ['$_id', 12] }, then: 'december' }
              ],
              default: 'unknown'
            }
          },
          spend: '$totalSpend',
          totalRevenue: '$totalRevenue'
        }
      }
    ]

    return await databaseService.report_ads.aggregate(pipeline).toArray()
  }
}

const reportAdsServices = new ReportAdsServices()
export default reportAdsServices
