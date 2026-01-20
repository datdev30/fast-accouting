import Joi from 'joi';

/**
 * Validation middleware factory
 * Creates middleware that validates request body/query/params using Joi schema
 */
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate({
            body: req.body,
            query: req.query,
            params: req.params
        }, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors
            });
        }

        // Replace with validated values
        req.body = value.body || req.body;
        req.query = value.query || req.query;
        req.params = value.params || req.params;

        next();
    };
};

/**
 * Customer validation schemas
 */
export const customerSchemas = {
    create: Joi.object({
        body: Joi.object({
            name: Joi.string().trim().min(2).max(100).required()
                .messages({
                    'string.empty': 'Tên khách hàng không được để trống',
                    'string.min': 'Tên khách hàng phải có ít nhất 2 ký tự',
                    'string.max': 'Tên khách hàng không được vượt quá 100 ký tự',
                    'any.required': 'Tên khách hàng là bắt buộc'
                }),
            contact_info: Joi.string().trim().max(200).allow(null, '')
                .messages({
                    'string.max': 'Thông tin liên hệ không được vượt quá 200 ký tự'
                })
        })
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().trim().required()
        }),
        body: Joi.object({
            name: Joi.string().trim().min(2).max(100)
                .messages({
                    'string.min': 'Tên khách hàng phải có ít nhất 2 ký tự',
                    'string.max': 'Tên khách hàng không được vượt quá 100 ký tự'
                }),
            contact_info: Joi.string().trim().max(200).allow(null, '')
                .messages({
                    'string.max': 'Thông tin liên hệ không được vượt quá 200 ký tự'
                })
        }).min(1).messages({
            'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
        })
    })
};

/**
 * Transaction validation schemas
 */
export const transactionSchemas = {
    create: Joi.object({
        body: Joi.object({
            customer_id: Joi.string().trim().required()
                .messages({
                    'string.empty': 'Vui lòng chọn khách hàng',
                    'any.required': 'Khách hàng là bắt buộc'
                }),
            type: Joi.string().trim().required()
                .messages({
                    'string.empty': 'Vui lòng chọn loại giao dịch',
                    'any.required': 'Loại giao dịch là bắt buộc'
                }),
            amount: Joi.number().positive().required()
                .messages({
                    'number.base': 'Số tiền phải là số',
                    'number.positive': 'Số tiền phải lớn hơn 0',
                    'any.required': 'Số tiền là bắt buộc'
                }),
            content: Joi.string().trim().min(3).required()
                .messages({
                    'string.empty': 'Nội dung giao dịch không được để trống',
                    'string.min': 'Nội dung phải có ít nhất 3 ký tự',
                    'any.required': 'Nội dung giao dịch là bắt buộc'
                }),
            transaction_date: Joi.date().iso().optional()
        })
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().trim().required()
        }),
        body: Joi.object({
            customer_id: Joi.string().trim(),
            type: Joi.string().trim(),
            amount: Joi.number().positive()
                .messages({
                    'number.base': 'Số tiền phải là số',
                    'number.positive': 'Số tiền phải lớn hơn 0'
                }),
            content: Joi.string().trim().min(3)
                .messages({
                    'string.min': 'Nội dung phải có ít nhất 3 ký tự'
                }),
            transaction_date: Joi.date().iso(),
            status: Joi.string().valid('OPEN', 'PAID'),
            closed_at: Joi.any().allow(null).optional()
        }).min(1).messages({
            'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
        })
    })
};

/**
 * Interest Config validation schemas
 */
export const interestConfigSchemas = {
    create: Joi.object({
        body: Joi.object({
            code: Joi.string().trim().min(2).max(20).pattern(/^[A-Z0-9_]+$/).required()
                .messages({
                    'string.empty': 'Mã cấu hình không được để trống',
                    'string.min': 'Mã cấu hình phải có ít nhất 2 ký tự',
                    'string.max': 'Mã cấu hình không được vượt quá 20 ký tự',
                    'string.pattern.base': 'Mã cấu hình chỉ được chứa chữ in hoa, số và dấu gạch dưới',
                    'any.required': 'Mã cấu hình là bắt buộc'
                }),
            name: Joi.string().trim().min(2).max(100).required()
                .messages({
                    'string.empty': 'Tên hiển thị không được để trống',
                    'string.min': 'Tên hiển thị phải có ít nhất 2 ký tự',
                    'string.max': 'Tên hiển thị không được vượt quá 100 ký tự',
                    'any.required': 'Tên hiển thị là bắt buộc'
                }),
            rate_per_month: Joi.number().min(0).max(100).required()
                .messages({
                    'number.base': 'Lãi suất phải là số',
                    'number.min': 'Lãi suất không được nhỏ hơn 0%',
                    'number.max': 'Lãi suất không được lớn hơn 100%',
                    'any.required': 'Lãi suất là bắt buộc'
                }),
            description: Joi.string().trim().max(500).allow(null, '')
                .messages({
                    'string.max': 'Mô tả không được vượt quá 500 ký tự'
                })
        })
    }),

    update: Joi.object({
        params: Joi.object({
            code: Joi.string().trim().required()
        }),
        body: Joi.object({
            name: Joi.string().trim().min(2).max(100)
                .messages({
                    'string.min': 'Tên hiển thị phải có ít nhất 2 ký tự',
                    'string.max': 'Tên hiển thị không được vượt quá 100 ký tự'
                }),
            rate_per_month: Joi.number().min(0).max(100)
                .messages({
                    'number.base': 'Lãi suất phải là số',
                    'number.min': 'Lãi suất không được nhỏ hơn 0%',
                    'number.max': 'Lãi suất không được lớn hơn 100%'
                }),
            description: Joi.string().trim().max(500).allow(null, '')
                .messages({
                    'string.max': 'Mô tả không được vượt quá 500 ký tự'
                })
        }).min(1).messages({
            'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
        })
    })
};

/**
 * User validation schemas
 */
export const userSchemas = {
    create: Joi.object({
        body: Joi.object({
            username: Joi.string().trim().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).lowercase().required()
                .messages({
                    'string.empty': 'Tên đăng nhập không được để trống',
                    'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
                    'string.max': 'Tên đăng nhập không được vượt quá 50 ký tự',
                    'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
                    'any.required': 'Tên đăng nhập là bắt buộc'
                }),
            password: Joi.string().min(6).max(100).required()
                .messages({
                    'string.empty': 'Mật khẩu không được để trống',
                    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
                    'string.max': 'Mật khẩu không được vượt quá 100 ký tự',
                    'any.required': 'Mật khẩu là bắt buộc'
                }),
            display_name: Joi.string().trim().max(100).allow(null, '')
                .messages({
                    'string.max': 'Tên hiển thị không được vượt quá 100 ký tự'
                }),
            role: Joi.string().valid('ADMIN', 'SALE').default('SALE'),
            pin: Joi.string().pattern(/^\d{6}$/).allow(null, '')
                .messages({
                    'string.pattern.base': 'Mã PIN phải có đúng 6 chữ số'
                })
        })
    }),

    update: Joi.object({
        params: Joi.object({
            id: Joi.string().trim().required()
        }),
        body: Joi.object({
            display_name: Joi.string().trim().max(100).allow(null, '')
                .messages({
                    'string.max': 'Tên hiển thị không được vượt quá 100 ký tự'
                }),
            role: Joi.string().valid('ADMIN', 'SALE'),
            password: Joi.string().min(6).max(100).allow('')
                .messages({
                    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
                    'string.max': 'Mật khẩu không được vượt quá 100 ký tự'
                }),
            pin: Joi.string().pattern(/^\d{6}$/).allow(null, '')
                .messages({
                    'string.pattern.base': 'Mã PIN phải có đúng 6 chữ số'
                })
        }).min(1).messages({
            'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
        })
    })
};

/**
 * Auth validation schemas
 */
export const authSchemas = {
    login: Joi.object({
        body: Joi.object({
            username: Joi.string().trim().min(1).lowercase().required()
                .messages({
                    'string.empty': 'Vui lòng nhập tên đăng nhập',
                    'string.min': 'Tên đăng nhập không được để trống',
                    'any.required': 'Tên đăng nhập là bắt buộc'
                }),
            password: Joi.string().min(1).required()
                .messages({
                    'string.empty': 'Vui lòng nhập mật khẩu',
                    'string.min': 'Mật khẩu không được để trống',
                    'any.required': 'Mật khẩu là bắt buộc'
                })
        })
    }),

    register: Joi.object({
        body: Joi.object({
            username: Joi.string().trim().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).lowercase().required()
                .messages({
                    'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
                    'string.max': 'Tên đăng nhập không được vượt quá 50 ký tự',
                    'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
                    'any.required': 'Tên đăng nhập là bắt buộc'
                }),
            password: Joi.string().min(6).max(100).required()
                .messages({
                    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
                    'string.max': 'Mật khẩu không được vượt quá 100 ký tự',
                    'any.required': 'Mật khẩu là bắt buộc'
                }),
            display_name: Joi.string().trim().max(100).allow(null, '')
        })
    })
};
