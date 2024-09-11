import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import validSchema from '../utils/joi/valid.schema.js'

const router = express.Router();

/** 아이템 구매 API **/
router.post('/buy/:itemId/:userTag', async (req, res, next) => {
    try{
        const { itemId, userTag } = req.body;
        
        // 아이템 존재 확인
        const item = await prisma.items.findUnique({
            where: { itemId: +itemId },
            select: {price: true}
        });
        if(item==null)
            return res.status(404).json({ message: '존재하지 않는 아이템입니다.'});
        
        // 인벤토리 아이템 유무 확인
        const inventory = await prisma.inventory.findUnique({
            where: { 
                itemId: +itemId,
                userTag: +userTag
            },
            select: {count: true}
        });
        if(inventory==null){
            // 인벤토리에 신규 아이템 추가
            await prisma.inventory.create({
                data: {
                    itemId: +itemId,
                    userTag: +userTag,
                    count: 1
                },
            });

            return res.status(201).json({ message: '성공적으로 구매했습니다.'});
        }
        // 인벤토리에 기존 아이템 개수 추가
        const {count} = inventory
        await prisma.inventory.update({
            where: {itemId: +itemId},
            data: {
                itemId,
                userId,
                count: ++count
            },
        });

        return res.status(201).json({ data: char, message: "성공적으로 구매했습니다."});
    } catch(error){
        next(error)
    }
});

/** 아이템 판매 API **/
router.post('/sell/:itemId/:userTag', async (req, res, next) => {
    try{
        const { itemId } = req.params;
        const validateBody = await validSchema.items.validateAsync(req.body)
        const { name, stat} = validateBody;

        const item = await prisma.items.findUnique({
            where: { itemId: +itemId },
        });
        if(item==null){
            return res.status(404).json({ message: '존재하지 않는 아이템입니다.'});
        }

        await prisma.items.update({
            data: {name, stat},
            where: {
                itemId: +itemId,
            }
        });
        
        return res.status(201).json({message: '정상적으로 수정되었습니다.'});
    } catch(error){
        next(error)
    }
});

/** 인벤토리 목록 조회 API **/
router.get('/stash/:charId', authMiddleware, async (req, res, next) => {
    try{
        const { charId } = req.params;
        const { userTag } = req.user;
        const char = await prisma.characters.findFirst({
            where: {
                charId: +charId,
            },
            select: {
            userTag: true,
            name: true,
            health: true,
            power: true,
            money: true
            },
        });
        if(char==null)
            return res.status(404).json({ message: '존재하지 않는 캐릭터입니다.' });
        if(char.userTag != userTag)
            return res.status(401).json({ message: '소유권이 없는 캐릭터입니다.' });

        const inventory = await prisma.inventory.findMany({
            where: {
                charId: +charId,
            },
            select: {
                itemId: true,    
                charId: true,
                count: true
            },
            orderBy:{
                itemId: 'asc'
            }
        });
        if(inventory==null){
            return res.status(404).json({ message: '아이템이 없습니다.' });
        }

        return res.status(201).json({data: inventory});
    } catch(error){
        next(error);
    }
});

export default router;